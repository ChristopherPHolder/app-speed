import { randomUUID } from 'node:crypto';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { Clock, Config, Context, Effect, Layer } from 'effect';
import type { SpaceAccess } from '@app-speed/platform/auth-api';
import type { AuditManagementCommand } from '@app-speed/audit/user-flow/api-contract';
import { nextOccurrence } from '@app-speed/audit/core/domain';
import {
  auditSpaceTable,
  auditTemplateTable,
  auditVersionTable,
  auditRunTable,
  auditScheduleTable,
  auditOccurrenceTable,
  auditResultTable,
  auditShareTable,
  DbClient,
  QueryError,
} from '@app-speed/audit/core/persistence';
import { USER_FLOW_AUDIT_KIND } from '@app-speed/audit/user-flow/domain';
import { userFlowAuditTemplateTable } from './schema';

export class SpaceAuditRepo extends Context.Service<
  SpaceAuditRepo,
  {
    execute: (
      command: AuditManagementCommand,
      space: SpaceAccess,
      credentials?: { browserHash: string | null; claimHash: string | null; shareHash: string | null },
    ) => Effect.Effect<unknown, QueryError>;
    readonly limits: { personal: number; organization: number };
  }
>()('SpaceAuditRepo') {
  static readonly live = Layer.effect(SpaceAuditRepo)(
    Effect.gen(function* () {
      const db = yield* DbClient;
      const personal = yield* Config.Int('PERSONAL_ACTIVE_SCHEDULE_LIMIT').pipe(Config.withDefault(10));
      const organization = yield* Config.Int('ORGANIZATION_ACTIVE_SCHEDULE_LIMIT').pipe(Config.withDefault(10));
      if (personal < 1 || organization < 1)
        return yield* new QueryError({ message: 'Schedule limits must be positive.' });
      const limits = { personal, organization };
      return {
        limits,
        execute: Effect.fn('audit.space.manage')(function* (command, space, credentials) {
          const now = new Date(yield* Clock.currentTimeMillis);
          return yield* db.run((client) =>
            client.transaction(async (tx) => {
              // One lock order for every mutation and dispatcher: space, schedule, template.
              // This serializes active-count checks, claims, edits, and dispatch per owning space.
              const owner = (
                await tx.select().from(auditSpaceTable).where(eq(auditSpaceTable.id, space.id)).for('update')
              )[0];
              if (!owner || owner.deletedAt) throw new Error('Space is unavailable.');
              const requireTemplate = async (id: string, mutate = false) => {
                const template = (
                  await tx
                    .select()
                    .from(auditTemplateTable)
                    .where(
                      and(
                        eq(auditTemplateTable.id, id),
                        eq(auditTemplateTable.spaceId, space.id),
                        isNull(auditTemplateTable.deletedAt),
                      ),
                    )
                    .for('update')
                )[0];
                if (
                  !template ||
                  template.kind !== 'user-flow' ||
                  (mutate && space.role !== 'admin' && template.createdBy !== space.userId)
                )
                  throw new Error('Audit is unavailable.');
                return template;
              };
              const requireVersion = async (id: string) => {
                const version = (await tx.select().from(auditVersionTable).where(eq(auditVersionTable.id, id)))[0];
                if (!version) throw new Error('Version is unavailable.');
                await requireTemplate(version.templateId);
                return version;
              };
              const requireSchedule = async (id: string, mutate = false) => {
                const schedule = (
                  await tx
                    .select()
                    .from(auditScheduleTable)
                    .where(and(eq(auditScheduleTable.id, id), eq(auditScheduleTable.spaceId, space.id)))
                    .for('update')
                )[0];
                if (
                  !schedule ||
                  (mutate && schedule.state === 'deleted') ||
                  (mutate && space.role !== 'admin' && schedule.createdBy !== space.userId)
                )
                  throw new Error('Schedule is unavailable.');
                return schedule;
              };
              const checkLimit = async () => {
                const active = await tx
                  .select({ id: auditScheduleTable.id })
                  .from(auditScheduleTable)
                  .where(and(eq(auditScheduleTable.spaceId, space.id), eq(auditScheduleTable.state, 'active')));
                if (active.length >= limits[space.kind])
                  throw new Error('Active schedule limit reached. Pause a schedule first.');
              };
              switch (command.action) {
                case 'list': {
                  const templates = await tx
                    .select()
                    .from(auditTemplateTable)
                    .where(and(eq(auditTemplateTable.spaceId, space.id), isNull(auditTemplateTable.deletedAt)))
                    .orderBy(desc(auditTemplateTable.createdAt));
                  const ids = templates.map((t) => t.id);
                  const versions = ids.length
                    ? await tx
                        .select()
                        .from(auditVersionTable)
                        .where(inArray(auditVersionTable.templateId, ids))
                        .orderBy(desc(auditVersionTable.createdAt))
                    : [];
                  const schedules = await tx
                    .select()
                    .from(auditScheduleTable)
                    .where(eq(auditScheduleTable.spaceId, space.id))
                    .orderBy(desc(auditScheduleTable.createdAt));
                  const shares = ids.length
                    ? await tx
                        .select({
                          id: auditShareTable.id,
                          runId: auditShareTable.runId,
                          revokedAt: auditShareTable.revokedAt,
                        })
                        .from(auditShareTable)
                        .innerJoin(auditRunTable, eq(auditRunTable.id, auditShareTable.runId))
                        .where(inArray(auditRunTable.templateId, ids))
                    : [];
                  return { space, limit: limits[space.kind], templates, versions, schedules, shares };
                }
                case 'save': {
                  const templateId = command.templateId ?? randomUUID();
                  if (command.templateId) {
                    await requireTemplate(templateId, true);
                    await tx
                      .update(auditTemplateTable)
                      .set({ title: command.definition.title, updatedAt: now })
                      .where(eq(auditTemplateTable.id, templateId));
                    await tx
                      .update(userFlowAuditTemplateTable)
                      .set({ definition: command.definition })
                      .where(eq(userFlowAuditTemplateTable.templateId, templateId));
                  } else {
                    await tx.insert(auditTemplateTable).values({
                      id: templateId,
                      kind: USER_FLOW_AUDIT_KIND,
                      title: command.definition.title,
                      spaceId: space.id,
                      createdBy: space.userId,
                      createdAt: now,
                      updatedAt: now,
                    });
                    await tx.insert(userFlowAuditTemplateTable).values({ templateId, definition: command.definition });
                  }
                  const versionId = randomUUID();
                  await tx
                    .insert(auditVersionTable)
                    .values({ id: versionId, templateId, definition: command.definition, createdAt: now });
                  return { templateId, versionId };
                }
                case 'deleteAudit': {
                  await requireTemplate(command.templateId, true);
                  if (space.role !== 'admin') {
                    const others = await tx
                      .select()
                      .from(auditScheduleTable)
                      .where(
                        and(
                          eq(auditScheduleTable.templateId, command.templateId),
                          inArray(auditScheduleTable.state, ['active', 'paused']),
                        ),
                      );
                    if (others.some((s) => s.createdBy !== space.userId))
                      throw new Error('An administrator must delete an audit used by other schedules.');
                  }
                  await tx
                    .update(auditScheduleTable)
                    .set({ state: 'deleted' })
                    .where(eq(auditScheduleTable.templateId, command.templateId));
                  await tx
                    .update(auditTemplateTable)
                    .set({ deletedAt: now })
                    .where(eq(auditTemplateTable.id, command.templateId));
                  return { ok: true };
                }
                case 'run': {
                  const version = await requireVersion(command.versionId);
                  const runId = randomUUID();
                  await tx.insert(auditRunTable).values({
                    id: runId,
                    templateId: version.templateId,
                    versionId: version.id,
                    createdAt: now,
                    updatedAt: now,
                  });
                  return { runId };
                }
                case 'claim': {
                  const run = (await tx.select().from(auditRunTable).where(eq(auditRunTable.id, command.runId)))[0];
                  if (!run) throw new Error('Audit is unavailable.');
                  const template = (
                    await tx
                      .select()
                      .from(auditTemplateTable)
                      .where(eq(auditTemplateTable.id, run.templateId))
                      .for('update')
                  )[0];
                  if (
                    !template ||
                    template.spaceId ||
                    !template.claimHash ||
                    !credentials?.claimHash ||
                    template.claimHash !== credentials.claimHash ||
                    !credentials.browserHash ||
                    template.guestBrowserHash !== credentials.browserHash
                  )
                    throw new Error('Claim credential is invalid or already used.');
                  await tx
                    .update(auditTemplateTable)
                    .set({
                      spaceId: space.id,
                      createdBy: space.userId,
                      claimHash: null,
                      guestBrowserHash: null,
                      updatedAt: now,
                    })
                    .where(eq(auditTemplateTable.id, template.id));
                  return { templateId: template.id };
                }
                case 'share': {
                  const run = (await tx.select().from(auditRunTable).where(eq(auditRunTable.id, command.runId)))[0];
                  if (!run || !credentials?.shareHash) throw new Error('Run is unavailable.');
                  await requireTemplate(run.templateId, true);
                  const shareId = randomUUID();
                  await tx
                    .insert(auditShareTable)
                    .values({ id: shareId, runId: run.id, tokenHash: credentials.shareHash });
                  return { shareId };
                }
                case 'revokeShare': {
                  const share = (
                    await tx
                      .select({ runId: auditShareTable.runId })
                      .from(auditShareTable)
                      .where(eq(auditShareTable.id, command.shareId))
                  )[0];
                  const run = share
                    ? (await tx.select().from(auditRunTable).where(eq(auditRunTable.id, share.runId)))[0]
                    : null;
                  if (!run) throw new Error('Share is unavailable.');
                  await requireTemplate(run.templateId, true);
                  await tx
                    .update(auditShareTable)
                    .set({ revokedAt: now })
                    .where(eq(auditShareTable.id, command.shareId));
                  return { ok: true };
                }
                case 'createSchedule': {
                  const version = await requireVersion(command.versionId);
                  await checkLimit();
                  const nextDueAt = nextOccurrence(command.recurrence, now);
                  const scheduleId = randomUUID();
                  await tx.insert(auditScheduleTable).values({
                    id: scheduleId,
                    spaceId: space.id,
                    templateId: version.templateId,
                    versionId: version.id,
                    createdBy: space.userId,
                    recurrence: command.recurrence,
                    nextDueAt,
                    createdAt: now,
                  });
                  return { scheduleId, nextDueAt };
                }
                case 'updateSchedule': {
                  const schedule = await requireSchedule(command.scheduleId, true);
                  if (command.createdBy && space.role !== 'admin')
                    throw new Error('Only administrators can reassign schedules.');
                  if (command.versionId && (await requireVersion(command.versionId)).templateId !== schedule.templateId)
                    throw new Error('Choose a version of this audit.');
                  if (command.state === 'active' && schedule.state !== 'active') await checkLimit();
                  const recurrence = command.recurrence ?? schedule.recurrence;
                  const reset = !!command.recurrence || (command.state === 'active' && schedule.state === 'paused');
                  await tx
                    .update(auditScheduleTable)
                    .set({
                      versionId: command.versionId ?? schedule.versionId,
                      recurrence,
                      state: command.state ?? schedule.state,
                      createdBy: command.createdBy ?? schedule.createdBy,
                      nextDueAt: reset ? nextOccurrence(recurrence, now) : schedule.nextDueAt,
                    })
                    .where(eq(auditScheduleTable.id, schedule.id));
                  return { ok: true };
                }
                case 'occurrences': {
                  await requireSchedule(command.scheduleId);
                  return await tx
                    .select({
                      occurrence: auditOccurrenceTable,
                      runStatus: auditRunTable.status,
                      resultStatus: auditResultTable.status,
                      error: auditResultTable.error,
                    })
                    .from(auditOccurrenceTable)
                    .leftJoin(auditRunTable, eq(auditRunTable.id, auditOccurrenceTable.runId))
                    .leftJoin(auditResultTable, eq(auditResultTable.runId, auditRunTable.id))
                    .where(eq(auditOccurrenceTable.scheduleId, command.scheduleId))
                    .orderBy(desc(auditOccurrenceTable.dueAt))
                    .limit(100);
                }
              }
            }),
          );
        }),
      };
    }),
  );
}
