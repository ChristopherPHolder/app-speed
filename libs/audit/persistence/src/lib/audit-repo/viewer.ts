import { eq } from 'drizzle-orm';
import { Effect, Schema } from 'effect';

import { DbClient, QueryError } from '../db';
import { type RecordPersistence, RecordPersistenceError, RecordPersistenceService } from '../record/service';
import { auditResultTable, auditRunTable, auditTemplateTable } from '../schema';
import { type AuditResultStatus, type AuditRunId, decodeAuditResultRecord, decodeAuditRunRecord } from './shared';

export const getRunById = Effect.fn('db.auditRun.getById')(function* (id: AuditRunId) {
  const db = yield* DbClient;
  yield* Effect.annotateCurrentSpan({ 'audit.id': id });

  const record = yield* db.run((client) =>
    client
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
      .where(eq(auditRunTable.id, id))
      .get(),
  );

  if (!record) {
    return null;
  }

  const decoded = yield* decodeAuditRunRecord(record);
  yield* Effect.annotateCurrentSpan({ 'audit.status': decoded.status });
  return decoded;
});

export const getResultByRunId = Effect.fn('db.auditResult.getByRunId')(function* (id: AuditRunId) {
  const db = yield* DbClient;
  const recordPersistence = yield* RecordPersistenceService;
  yield* Effect.annotateCurrentSpan({ 'audit.id': id });

  const record = yield* db.run((client) =>
    client
      .select({
        runId: auditResultTable.runId,
        status: auditResultTable.status,
        dataRecordKey: auditResultTable.dataRecordKey,
        error: auditResultTable.error,
        reportHtmlRecordKey: auditResultTable.reportHtmlRecordKey,
        createdAt: auditResultTable.createdAt,
      })
      .from(auditResultTable)
      .where(eq(auditResultTable.runId, id))
      .get(),
  );

  if (!record) {
    return null;
  }

  const hydratedResult =
    record.status === 'SUCCESS'
      ? yield* hydrateSuccessResult(record, recordPersistence)
      : {
          ...record,
          data: null,
          reportHtml: null,
        };

  const decoded = yield* decodeAuditResultRecord(hydratedResult);
  yield* Effect.annotateCurrentSpan({ 'audit.result_status': decoded.status });
  return decoded;
});

const toQueryError = (error: RecordPersistenceError) =>
  new QueryError({
    message: `Record persistence ${error.operation} failed: ${error.message}`,
    cause: error,
  });

const JsonRecordSchema = Schema.parseJson(Schema.Unknown);

const decodeJsonRecord = Schema.decodeUnknown(JsonRecordSchema);

const parseResultData = (value: string) =>
  decodeJsonRecord(value).pipe(
    Effect.mapError(
      (cause) =>
        new QueryError({
          message: 'Failed to parse audit result data record.',
          cause,
        }),
    ),
  );

const requireRecord = (value: string | null, message: string) =>
  Effect.fromNullable(value).pipe(Effect.orElseFail(() => new QueryError({ message })));

const getRecord = (recordPersistence: RecordPersistence, recordKey: string, missingMessage: string) =>
  Effect.gen(function* () {
    const key = yield* recordPersistence.decodeRecordKey(recordKey);
    const stored = yield* recordPersistence.get(key).pipe(Effect.catchAll(toQueryError));
    return yield* requireRecord(stored, missingMessage);
  });

const hydrateSuccessResult = (
  record: {
    runId: string;
    status: AuditResultStatus;
    dataRecordKey: string | null;
    error: unknown;
    reportHtmlRecordKey: string | null;
    createdAt: Date;
  },
  recordPersistence: RecordPersistence,
) =>
  Effect.gen(function* () {
    const dataRecordKey = yield* requireRecord(
      record.dataRecordKey,
      'Successful audit result is missing a data record key.',
    );
    const serializedData = yield* getRecord(
      recordPersistence,
      dataRecordKey,
      'Referenced audit result data record is missing.',
    );
    const data = yield* parseResultData(serializedData);
    const reportHtml =
      record.reportHtmlRecordKey === null
        ? null
        : yield* getRecord(
            recordPersistence,
            record.reportHtmlRecordKey,
            'Referenced audit result report HTML record is missing.',
          );

    return {
      ...record,
      data,
      reportHtml,
    };
  });
