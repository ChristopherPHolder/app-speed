import { randomUUID } from 'node:crypto';
import { and, asc, eq, lt, or, sql } from 'drizzle-orm';
import { Clock, Effect } from 'effect';

import { DbClient } from '../db';
import { auditResultTable, auditRunTable, auditTemplateTable } from '../schema';
import { type AuditRunId, decodeAuditRunRecord } from './shared';

export const claimNextRun = Effect.fn('db.auditRun.claimNext')(function* () {
  const db = yield* DbClient;
  const now = new Date(yield* Clock.currentTimeMillis);

  const claimed = yield* db.run((client) =>
    client.transaction((tx) => {
      const next = tx
        .select({ id: auditRunTable.id })
        .from(auditRunTable)
        .where(eq(auditRunTable.status, 'SCHEDULED'))
        .orderBy(asc(auditRunTable.createdAt), asc(auditRunTable.id))
        .get();

      if (!next) {
        return null;
      }

      const updated = tx
        .update(auditRunTable)
        .set({
          status: 'IN_PROGRESS',
          startedAt: now,
          updatedAt: now,
        })
        .where(and(eq(auditRunTable.id, next.id), eq(auditRunTable.status, 'SCHEDULED')))
        .run();

      if (updated.changes === 0) {
        return null;
      }

      return tx
        .select({
          id: auditRunTable.id,
          templateId: auditRunTable.templateId,
          status: auditRunTable.status,
          createdAt: auditRunTable.createdAt,
          updatedAt: auditRunTable.updatedAt,
          startedAt: auditRunTable.startedAt,
          completedAt: auditRunTable.completedAt,
          durationMs: auditRunTable.durationMs,
          templateData: auditTemplateTable.data,
        })
        .from(auditRunTable)
        .innerJoin(auditTemplateTable, eq(auditTemplateTable.id, auditRunTable.templateId))
        .where(eq(auditRunTable.id, next.id))
        .get();
    }),
  );

  if (!claimed) {
    yield* Effect.annotateCurrentSpan({ 'audit.claimed': false });
    return null;
  }

  const decoded = yield* decodeAuditRunRecord(claimed);
  yield* Effect.annotateCurrentSpan({
    'audit.claimed': true,
    'audit.id': decoded.id,
    'audit.status': decoded.status,
  });
  return decoded;
});

export const hasScheduledRuns = Effect.fn('db.auditRun.hasScheduledRuns')(function* () {
  const db = yield* DbClient;
  const scheduledRun = yield* db.run((client) =>
    client
      .select({ id: auditRunTable.id })
      .from(auditRunTable)
      .where(eq(auditRunTable.status, 'SCHEDULED'))
      .limit(1)
      .get(),
  );

  const hasQueuedWork = scheduledRun !== undefined;
  yield* Effect.annotateCurrentSpan({ 'audit.scheduled_exists': hasQueuedWork });
  return hasQueuedWork;
});

export const markRunInProgress = (id: AuditRunId) =>
  Effect.gen(function* () {
    const db = yield* DbClient;
    const now = new Date(yield* Clock.currentTimeMillis);
    yield* Effect.annotateCurrentSpan({ 'audit.id': id });

    yield* db.run((client) =>
      client
        .update(auditRunTable)
        .set({ status: 'IN_PROGRESS', startedAt: now, updatedAt: now })
        .where(eq(auditRunTable.id, id))
        .run(),
    );
  }).pipe(Effect.withSpan('db.auditRun.markInProgress'), Effect.asVoid);

export const getQueuePosition = Effect.fn('db.auditRun.getQueuePosition')(function* (id: AuditRunId) {
  const db = yield* DbClient;
  yield* Effect.annotateCurrentSpan({ 'audit.id': id });

  const run = yield* db.run((client) =>
    client
      .select({
        id: auditRunTable.id,
        createdAt: auditRunTable.createdAt,
        status: auditRunTable.status,
      })
      .from(auditRunTable)
      .where(eq(auditRunTable.id, id))
      .get(),
  );

  if (!run) {
    yield* Effect.annotateCurrentSpan({ 'queue.position': null });
    return null;
  }

  if (run.status !== 'SCHEDULED') {
    yield* Effect.annotateCurrentSpan({
      'audit.status': run.status,
      'queue.position': 0,
    });
    return 0;
  }

  const queued = yield* db.run((client) =>
    client
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
      .get(),
  );

  const position = Number(queued?.count ?? 0);
  yield* Effect.annotateCurrentSpan({
    'audit.status': run.status,
    'queue.position': position,
  });

  return position;
});

export const completeRun = (
  id: AuditRunId,
  result: { status: 'SUCCESS' | 'FAILURE'; data: unknown; error?: unknown; reportHtml?: string | null },
  durationMs: number,
) =>
  Effect.gen(function* () {
    const db = yield* DbClient;
    const now = new Date(yield* Clock.currentTimeMillis);
    yield* Effect.annotateCurrentSpan({
      'audit.id': id,
      'audit.status': result.status,
      'audit.duration_ms': durationMs,
    });

    yield* db.run((client) =>
      client.transaction((tx) => {
        tx.update(auditRunTable)
          .set({
            status: 'COMPLETE',
            completedAt: now,
            durationMs,
            updatedAt: now,
          })
          .where(eq(auditRunTable.id, id))
          .run();

        tx.insert(auditResultTable)
          .values({
            id: randomUUID(),
            runId: id,
            status: result.status,
            data: result.data ?? null,
            error: result.error ?? null,
            reportHtml: result.reportHtml ?? null,
            createdAt: now,
          })
          .run();
      }),
    );
  }).pipe(Effect.withSpan('db.auditRun.complete'), Effect.asVoid);
