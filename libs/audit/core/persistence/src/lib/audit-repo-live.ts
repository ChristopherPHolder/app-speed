import { randomUUID } from 'node:crypto';
import { and, asc, eq, lt, or, sql } from 'drizzle-orm';
import { Clock, Effect, Layer } from 'effect';

import { AuditRepo } from './audit-repo';
import { decodeAuditResultRecord, decodeAuditRunRecord, type AuditRunId } from './audit-record';
import { DbClient } from './db';
import { auditResultTable, auditRunTable, auditTemplateTable } from './schema';

const claimNextRun = Effect.fn('db.auditRun.claimNext')(function* () {
  const db = yield* DbClient;
  const now = new Date(yield* Clock.currentTimeMillis);
  const claimed = yield* db.run((client) =>
    client.transaction(async (tx) => {
      const next = (
        await tx
          .select({ id: auditRunTable.id })
          .from(auditRunTable)
          .where(eq(auditRunTable.status, 'SCHEDULED'))
          .orderBy(asc(auditRunTable.createdAt), asc(auditRunTable.id))
          .limit(1)
          .for('update', { skipLocked: true })
      )[0];

      if (!next) return null;

      const updated = await tx
        .update(auditRunTable)
        .set({ status: 'IN_PROGRESS', startedAt: now, updatedAt: now })
        .where(and(eq(auditRunTable.id, next.id), eq(auditRunTable.status, 'SCHEDULED')))
        .returning({ id: auditRunTable.id });
      if (updated.length === 0) return null;

      return (
        await tx
          .select({
            id: auditRunTable.id,
            templateId: auditRunTable.templateId,
            status: auditRunTable.status,
            createdAt: auditRunTable.createdAt,
            updatedAt: auditRunTable.updatedAt,
            startedAt: auditRunTable.startedAt,
            completedAt: auditRunTable.completedAt,
            durationMs: auditRunTable.durationMs,
            kind: auditTemplateTable.kind,
          })
          .from(auditRunTable)
          .innerJoin(auditTemplateTable, eq(auditTemplateTable.id, auditRunTable.templateId))
          .where(eq(auditRunTable.id, next.id))
          .limit(1)
      )[0];
    }),
  );

  return claimed ? yield* decodeAuditRunRecord(claimed) : null;
});

const hasScheduledRuns = Effect.fn('db.auditRun.hasScheduledRuns')(function* () {
  const db = yield* DbClient;
  const row = yield* db.run(
    async (client) =>
      (
        await client
          .select({ id: auditRunTable.id })
          .from(auditRunTable)
          .where(eq(auditRunTable.status, 'SCHEDULED'))
          .limit(1)
      )[0],
  );
  return row !== undefined;
});

const getQueuePosition = Effect.fn('db.auditRun.getQueuePosition')(function* (id: AuditRunId) {
  const db = yield* DbClient;
  const run = yield* db.run(
    async (client) =>
      (
        await client
          .select({ id: auditRunTable.id, createdAt: auditRunTable.createdAt, status: auditRunTable.status })
          .from(auditRunTable)
          .where(eq(auditRunTable.id, id))
          .limit(1)
      )[0],
  );
  if (!run) return null;
  if (run.status !== 'SCHEDULED') return 0;

  const queued = yield* db.run(
    async (client) =>
      (
        await client
          .select({ count: sql<number>`count(*)` })
          .from(auditRunTable)
          .where(
            and(
              eq(auditRunTable.status, 'SCHEDULED'),
              or(
                lt(auditRunTable.createdAt, run.createdAt),
                and(eq(auditRunTable.createdAt, run.createdAt), lt(auditRunTable.id, run.id)),
              ),
            ),
          )
          .limit(1)
      )[0],
  );
  return Number(queued?.count ?? 0);
});

const getRunById = Effect.fn('db.auditRun.getById')(function* (id: AuditRunId) {
  const db = yield* DbClient;
  const row = yield* db.run(
    async (client) =>
      (
        await client
          .select({
            id: auditRunTable.id,
            templateId: auditRunTable.templateId,
            status: auditRunTable.status,
            createdAt: auditRunTable.createdAt,
            updatedAt: auditRunTable.updatedAt,
            startedAt: auditRunTable.startedAt,
            completedAt: auditRunTable.completedAt,
            durationMs: auditRunTable.durationMs,
            kind: auditTemplateTable.kind,
          })
          .from(auditRunTable)
          .innerJoin(auditTemplateTable, eq(auditTemplateTable.id, auditRunTable.templateId))
          .where(eq(auditRunTable.id, id))
          .limit(1)
      )[0],
  );
  return row ? yield* decodeAuditRunRecord(row) : null;
});

const getResultByRunId = Effect.fn('db.auditResult.getByRunId')(function* (id: AuditRunId) {
  const db = yield* DbClient;
  const row = yield* db.run(
    async (client) =>
      (
        await client
          .select({
            id: auditResultTable.id,
            runId: auditResultTable.runId,
            status: auditResultTable.status,
            error: auditResultTable.error,
            createdAt: auditResultTable.createdAt,
          })
          .from(auditResultTable)
          .where(eq(auditResultTable.runId, id))
          .limit(1)
      )[0],
  );
  return row ? yield* decodeAuditResultRecord(row) : null;
});

const completeFailure = Effect.fn('db.auditRun.completeFailure')(function* (
  id: AuditRunId,
  error: unknown,
  durationMs: number,
) {
  const db = yield* DbClient;
  const now = new Date(yield* Clock.currentTimeMillis);
  const normalizedDurationMs = Math.round(durationMs);
  yield* db.run((client) =>
    client.transaction(async (tx) => {
      await tx
        .update(auditRunTable)
        .set({ status: 'COMPLETE', completedAt: now, durationMs: normalizedDurationMs, updatedAt: now })
        .where(eq(auditRunTable.id, id));
      await tx.insert(auditResultTable).values({
        id: randomUUID(),
        runId: id,
        status: 'FAILURE',
        error,
        createdAt: now,
      });
    }),
  );
});

export const AuditRepoLive = Layer.effect(AuditRepo)(
  Effect.gen(function* () {
    const db = yield* DbClient;
    const provideDb = <A, E, R>(effect: Effect.Effect<A, E, R>) => effect.pipe(Effect.provideService(DbClient, db));
    return {
      claimNextRun: () => provideDb(claimNextRun()),
      hasScheduledRuns: () => provideDb(hasScheduledRuns()),
      getQueuePosition: (id: AuditRunId) => provideDb(getQueuePosition(id)),
      getRunById: (id: AuditRunId) => provideDb(getRunById(id)),
      getResultByRunId: (id: AuditRunId) => provideDb(getResultByRunId(id)),
      completeFailure: (id: AuditRunId, error: unknown, durationMs: number) =>
        provideDb(completeFailure(id, error, durationMs)),
    };
  }),
);
