import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { Clock, Context, Effect, Layer, Schema } from 'effect';

import {
  AuditHistoryRepo,
  AuditRepo,
  auditResultTable,
  auditRunTable,
  DbClient,
  QueryError,
  type AuditRunId,
  type AuditRunListCursor,
  type AuditStatus,
  type AuditTemplateId,
  type RecordPersistence,
  RecordPersistenceError,
  RecordPersistenceService,
} from '@app-speed/audit/core/persistence';
import type { UserFlowAuditDefinition } from '@app-speed/audit/user-flow/domain';

import { getRunDetailsById, getRunSummaryById, listRunsPage } from './audit-repo/runs';
import { userFlowAuditResultTable, userFlowAuditTemplateTable } from './schema';

export type UserFlowAuditResult =
  | { status: 'SUCCESS'; flowResult: unknown; reportHtml: string }
  | { status: 'FAILURE'; error: unknown };

export class UserFlowAuditRepo extends Context.Tag('UserFlowAuditRepo')<
  UserFlowAuditRepo,
  {
    getDefinition: (templateId: AuditTemplateId) => Effect.Effect<UserFlowAuditDefinition | null, QueryError>;
    getResultByRunId: (id: AuditRunId) => Effect.Effect<UserFlowAuditResult | null, QueryError>;
    completeSuccess: (
      id: AuditRunId,
      result: { flowResult: unknown; reportHtml: string },
      durationMs: number,
    ) => Effect.Effect<void, QueryError>;
  }
>() {}

const toQueryError = (error: RecordPersistenceError) =>
  new QueryError({ message: `Record persistence ${error.operation} failed: ${error.message}`, cause: error });

const JsonRecordSchema = Schema.parseJson(Schema.Unknown);
const encodeJsonRecord = Schema.encodeUnknown(JsonRecordSchema);
const decodeJsonRecord = Schema.decodeUnknown(JsonRecordSchema);

const requireRecord = (value: string | null, message: string) =>
  Effect.fromNullable(value).pipe(Effect.orElseFail(() => new QueryError({ message })));

const getRecord = (recordPersistence: RecordPersistence, recordKey: string, missingMessage: string) =>
  Effect.gen(function* () {
    const key = yield* recordPersistence
      .decodeRecordKey(recordKey)
      .pipe(Effect.mapError((cause) => new QueryError({ message: 'Invalid record key.', cause })));
    const stored = yield* recordPersistence.get(key).pipe(Effect.catchAll(toQueryError));
    return yield* requireRecord(stored, missingMessage);
  });

const getDefinition = Effect.fn('db.userFlow.getDefinition')(function* (templateId: AuditTemplateId) {
  const db = yield* DbClient;
  const row = yield* db.run(
    async (client) =>
      (
        await client
          .select({ definition: userFlowAuditTemplateTable.definition })
          .from(userFlowAuditTemplateTable)
          .where(eq(userFlowAuditTemplateTable.templateId, templateId))
          .limit(1)
      )[0],
  );
  return row?.definition ?? null;
});

const getResultByRunId = Effect.fn('db.userFlow.getResultByRunId')(function* (id: AuditRunId) {
  const db = yield* DbClient;
  const records = yield* RecordPersistenceService;
  const row = yield* db.run(
    async (client) =>
      (
        await client
          .select({
            status: auditResultTable.status,
            error: auditResultTable.error,
            flowResultRecordKey: userFlowAuditResultTable.flowResultRecordKey,
            reportHtmlRecordKey: userFlowAuditResultTable.reportHtmlRecordKey,
          })
          .from(auditResultTable)
          .leftJoin(userFlowAuditResultTable, eq(userFlowAuditResultTable.resultId, auditResultTable.id))
          .where(eq(auditResultTable.runId, id))
          .limit(1)
      )[0],
  );
  if (!row) return null;
  if (row.status === 'FAILURE') return { status: 'FAILURE' as const, error: row.error };

  const flowResultRecordKey = yield* requireRecord(
    row.flowResultRecordKey,
    'Successful user-flow result is missing its Lighthouse result record key.',
  );
  const reportHtmlRecordKey = yield* requireRecord(
    row.reportHtmlRecordKey,
    'Successful user-flow result is missing its report record key.',
  );
  const serializedFlowResult = yield* getRecord(records, flowResultRecordKey, 'Stored Lighthouse result is missing.');
  const flowResult = yield* decodeJsonRecord(serializedFlowResult).pipe(
    Effect.mapError((cause) => new QueryError({ message: 'Failed to parse stored Lighthouse result.', cause })),
  );
  const reportHtml = yield* getRecord(records, reportHtmlRecordKey, 'Stored Lighthouse report is missing.');
  return { status: 'SUCCESS' as const, flowResult, reportHtml };
});

const completeSuccess = Effect.fn('db.userFlow.completeSuccess')(function* (
  id: AuditRunId,
  result: { flowResult: unknown; reportHtml: string },
  durationMs: number,
) {
  const db = yield* DbClient;
  const records = yield* RecordPersistenceService;
  const now = new Date(yield* Clock.currentTimeMillis);
  const resultId = randomUUID();
  const flowResultRecordKey = records.makeRecordKey(`user-flow-result:${id}`);
  const reportHtmlRecordKey = records.makeRecordKey(`user-flow-report:${id}`);
  const serializedFlowResult = yield* encodeJsonRecord(result.flowResult).pipe(
    Effect.mapError((cause) => new QueryError({ message: 'Failed to serialize Lighthouse result.', cause })),
  );

  yield* records.put(flowResultRecordKey, serializedFlowResult).pipe(Effect.catchAll(toQueryError));
  yield* records.put(reportHtmlRecordKey, result.reportHtml).pipe(Effect.catchAll(toQueryError));

  yield* db.run((client) =>
    client.transaction(async (tx) => {
      await tx
        .update(auditRunTable)
        .set({
          status: 'COMPLETE',
          completedAt: now,
          durationMs: Math.round(durationMs),
          updatedAt: now,
        })
        .where(eq(auditRunTable.id, id));
      await tx.insert(auditResultTable).values({
        id: resultId,
        runId: id,
        status: 'SUCCESS',
        error: null,
        createdAt: now,
      });
      await tx.insert(userFlowAuditResultTable).values({
        resultId,
        flowResultRecordKey,
        reportHtmlRecordKey,
      });
    }),
  );
});

export const UserFlowAuditRepoLive = Layer.effect(
  UserFlowAuditRepo,
  Effect.gen(function* () {
    const db = yield* DbClient;
    const records = yield* RecordPersistenceService;
    const provide = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
      effect.pipe(Effect.provideService(DbClient, db), Effect.provideService(RecordPersistenceService, records));
    return {
      getDefinition: (templateId: AuditTemplateId) => provide(getDefinition(templateId)),
      getResultByRunId: (id: AuditRunId) => provide(getResultByRunId(id)),
      completeSuccess: (id: AuditRunId, result: { flowResult: unknown; reportHtml: string }, durationMs: number) =>
        provide(completeSuccess(id, result, durationMs)),
    };
  }),
);

export const UserFlowAuditHistoryRepoLive = Layer.effect(
  AuditHistoryRepo,
  Effect.gen(function* () {
    const db = yield* DbClient;
    const auditRepo = yield* AuditRepo;
    const provide = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
      effect.pipe(Effect.provideService(DbClient, db), Effect.provideService(AuditRepo, auditRepo));
    return {
      getRunSummaryById: (id: AuditRunId) => provide(getRunSummaryById(id)),
      getRunDetailsById: (id: AuditRunId) => provide(getRunDetailsById(id)),
      listRunsPage: (params: {
        limit: number;
        cursor: AuditRunListCursor | null;
        status: ReadonlyArray<AuditStatus> | null;
      }) => provide(listRunsPage(params)),
    };
  }),
);
