import { randomUUID } from 'node:crypto';
import { and, asc, eq, lt, or, sql } from 'drizzle-orm';
import { Clock, Effect, Schema } from 'effect';

import { DbClient, QueryError } from '../db';
import { RecordPersistenceError, RecordPersistenceService } from '../record/service';
import { auditResultTable, auditRunTable, auditTemplateTable } from '../schema';
import { type AuditRunId, decodeAuditRunRecord } from './shared';

export const claimNextRun = Effect.fn('db.auditRun.claimNext')(function* () {
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

      if (!next) {
        return null;
      }

      const updated = await tx
        .update(auditRunTable)
        .set({
          status: 'IN_PROGRESS',
          startedAt: now,
          updatedAt: now,
        })
        .where(and(eq(auditRunTable.id, next.id), eq(auditRunTable.status, 'SCHEDULED')))
        .returning({ id: auditRunTable.id });

      if (updated.length === 0) {
        return null;
      }

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
            templateData: auditTemplateTable.data,
          })
          .from(auditRunTable)
          .innerJoin(auditTemplateTable, eq(auditTemplateTable.id, auditRunTable.templateId))
          .where(eq(auditRunTable.id, next.id))
          .limit(1)
      )[0];
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
  const scheduledRun = yield* db.run(
    async (client) =>
      (
        await client
          .select({ id: auditRunTable.id })
          .from(auditRunTable)
          .where(eq(auditRunTable.status, 'SCHEDULED'))
          .limit(1)
      )[0],
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
        .where(eq(auditRunTable.id, id)),
    );
  }).pipe(Effect.withSpan('db.auditRun.markInProgress'), Effect.asVoid);

export const getQueuePosition = Effect.fn('db.auditRun.getQueuePosition')(function* (id: AuditRunId) {
  const db = yield* DbClient;
  yield* Effect.annotateCurrentSpan({ 'audit.id': id });

  const run = yield* db.run(
    async (client) =>
      (
        await client
          .select({
            id: auditRunTable.id,
            createdAt: auditRunTable.createdAt,
            status: auditRunTable.status,
          })
          .from(auditRunTable)
          .where(eq(auditRunTable.id, id))
          .limit(1)
      )[0],
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
    const normalizedDurationMs = Math.round(durationMs);
    yield* Effect.annotateCurrentSpan({
      'audit.id': id,
      'audit.status': result.status,
      'audit.duration_ms': normalizedDurationMs,
    });

    const resultMetadata =
      result.status === 'SUCCESS'
        ? yield* persistSuccessResult(id, {
            status: 'SUCCESS',
            data: result.data,
            error: result.error,
            reportHtml: result.reportHtml,
          })
        : {
            dataRecordKey: null,
            error: result.error ?? null,
            reportHtmlRecordKey: null,
          };

    yield* db.run((client) =>
      client.transaction(async (tx) => {
        await tx
          .update(auditRunTable)
          .set({
            status: 'COMPLETE',
            completedAt: now,
            durationMs: normalizedDurationMs,
            updatedAt: now,
          })
          .where(eq(auditRunTable.id, id));

        await tx.insert(auditResultTable).values({
          id: randomUUID(),
          runId: id,
          status: result.status,
          ...resultMetadata,
          createdAt: now,
        });
      }),
    );
  }).pipe(Effect.withSpan('db.auditRun.complete'), Effect.asVoid);

const toQueryError = (error: RecordPersistenceError) =>
  new QueryError({
    message: `Record persistence ${error.operation} failed: ${error.message}`,
    cause: error,
  });

const JsonRecordSchema = Schema.parseJson(Schema.Unknown);

const encodeJsonRecord = Schema.encodeUnknown(JsonRecordSchema);

const serializeResultData = (data: unknown) =>
  encodeJsonRecord(data).pipe(
    Effect.mapError(
      (cause) =>
        new QueryError({
          message: 'Failed to serialize audit result data record.',
          cause,
        }),
    ),
  );

const persistSuccessResult = (
  id: AuditRunId,
  result: { status: 'SUCCESS'; data: unknown; error?: unknown; reportHtml?: string | null },
) =>
  Effect.gen(function* () {
    const recordPersistence = yield* RecordPersistenceService;
    const dataRecordKey = recordPersistence.makeRecordKey(`audit-result-data:${id}`);
    let reportHtmlRecordKey: string | null = null;

    const serializedData = yield* serializeResultData(result.data);
    yield* recordPersistence.put(dataRecordKey, serializedData).pipe(Effect.catchAll(toQueryError));

    if (result.reportHtml != null) {
      const key = recordPersistence.makeRecordKey(`audit-result-report:${id}`);
      reportHtmlRecordKey = key;
      yield* recordPersistence.put(key, result.reportHtml).pipe(Effect.catchAll(toQueryError));
    }

    return {
      dataRecordKey,
      error: null,
      reportHtmlRecordKey,
    };
  });
