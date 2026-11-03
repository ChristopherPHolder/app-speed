import { randomUUID } from 'node:crypto';
import { and, eq, inArray, lte } from 'drizzle-orm';
import { Clock, Context, Effect, Layer } from 'effect';
import { advanceOccurrences } from '@app-speed/audit/core/domain';
import { ClerkIdentity } from '@app-speed/platform/auth-api';
import { DbClient, QueryError } from './db';
import {
  auditOccurrenceTable,
  auditRunTable,
  auditScheduleTable,
  auditShareTable,
  auditSpaceTable,
  auditTemplateTable,
} from './schema';

/** The poller runs every second; occurrences more than five seconds late are missed, never caught up. */
export const DISPATCH_WINDOW_MS = 5_000;
export class RecurringDispatch extends Context.Service<
  RecurringDispatch,
  {
    tick: Effect.Effect<number, QueryError>;
  }
>()('RecurringDispatch') {
  static readonly live = Layer.effect(RecurringDispatch)(
    Effect.gen(function* () {
      const db = yield* DbClient;
      const clerk = yield* ClerkIdentity;
      const tick = Effect.gen(function* () {
        const now = new Date(yield* Clock.currentTimeMillis);
        const due = yield* db.run((client) =>
          client
            .select({ spaceId: auditScheduleTable.spaceId })
            .from(auditScheduleTable)
            .where(and(eq(auditScheduleTable.state, 'active'), lte(auditScheduleTable.nextDueAt, now)))
            .limit(100),
        );
        let dispatched = 0;
        for (const spaceId of new Set(due.map((s) => s.spaceId))) {
          // Space existence is independent of the creator's session/membership. Fail closed on outages.
          const alive = yield* clerk
            .exists(spaceId)
            .pipe(Effect.mapError((cause) => new QueryError({ message: 'Could not verify scheduling space.', cause })));
          const dispatchTime = new Date(yield* Clock.currentTimeMillis);
          dispatched += yield* db.run((client) =>
            client.transaction(async (tx) => {
              const owner = (
                await tx.select().from(auditSpaceTable).where(eq(auditSpaceTable.id, spaceId)).for('update')
              )[0];
              if (!owner) return 0;
              if (!alive || owner.deletedAt) {
                await tx
                  .update(auditSpaceTable)
                  .set({ deletedAt: owner.deletedAt ?? dispatchTime })
                  .where(eq(auditSpaceTable.id, spaceId));
                await tx
                  .update(auditScheduleTable)
                  .set({ state: 'deleted' })
                  .where(eq(auditScheduleTable.spaceId, spaceId));
                const runs = tx
                  .select({ id: auditRunTable.id })
                  .from(auditRunTable)
                  .innerJoin(auditTemplateTable, eq(auditTemplateTable.id, auditRunTable.templateId))
                  .where(eq(auditTemplateTable.spaceId, spaceId));
                await tx
                  .update(auditShareTable)
                  .set({ revokedAt: dispatchTime })
                  .where(inArray(auditShareTable.runId, runs));
                return 0;
              }
              const schedules = await tx
                .select()
                .from(auditScheduleTable)
                .where(
                  and(
                    eq(auditScheduleTable.spaceId, spaceId),
                    eq(auditScheduleTable.state, 'active'),
                    lte(auditScheduleTable.nextDueAt, dispatchTime),
                  ),
                )
                .for('update');
              let count = 0;
              for (const schedule of schedules) {
                const advance = advanceOccurrences(schedule.recurrence, schedule.nextDueAt, dispatchTime);
                const missed = dispatchTime.getTime() - schedule.nextDueAt.getTime() > DISPATCH_WINDOW_MS;
                const overlap = (
                  await tx
                    .select({ id: auditRunTable.id })
                    .from(auditRunTable)
                    .where(
                      and(
                        eq(auditRunTable.scheduleId, schedule.id),
                        inArray(auditRunTable.status, ['SCHEDULED', 'IN_PROGRESS']),
                      ),
                    )
                    .limit(1)
                )[0];
                const runId = !missed && !overlap ? randomUUID() : null;
                // Advance, occurrence and queued run commit together. Space lock serializes competing ticks,
                // pauses/edits and limits; unique(schedule,due) also guards accidental duplicate dispatch.
                if (runId) {
                  await tx.insert(auditRunTable).values({
                    id: runId,
                    templateId: schedule.templateId,
                    versionId: schedule.versionId,
                    scheduleId: schedule.id,
                    createdAt: dispatchTime,
                    updatedAt: dispatchTime,
                  });
                  count++;
                }
                await tx.insert(auditOccurrenceTable).values({
                  scheduleId: schedule.id,
                  dueAt: schedule.nextDueAt,
                  throughAt: missed ? dispatchTime : null,
                  count: advance.count,
                  outcome: missed ? 'missed' : overlap ? 'overlap' : 'dispatched',
                  runId,
                  versionId: schedule.versionId,
                });
                await tx
                  .update(auditScheduleTable)
                  .set({ nextDueAt: advance.next })
                  .where(eq(auditScheduleTable.id, schedule.id));
              }
              return count;
            }),
          );
        }
        return dispatched;
      });
      return { tick };
    }),
  );
}
