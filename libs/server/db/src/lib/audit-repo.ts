import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq, inArray, lt, or, sql } from 'drizzle-orm';
import { Clock, Context, Effect, Layer, ParseResult, Schema } from 'effect';
import { ReplayUserflowAudit, ReplayUserflowAuditSchema } from '@app-speed/shared-user-flow-replay/schema';
import { DbClient, QueryError } from './db';
import { auditResultTable, auditRunTable, auditTemplateTable, type AuditResultStatus } from './schema';

export const AuditTemplateIdSchema = Schema.NonEmptyString.pipe(Schema.brand('AuditTemplateId'));
export type AuditTemplateId = typeof AuditTemplateIdSchema.Type;

export const AuditRunIdSchema = Schema.NonEmptyString.pipe(Schema.brand('AuditRunId'));
export type AuditRunId = typeof AuditRunIdSchema.Type;

const AuditStatusSchema = Schema.Literal('SCHEDULED', 'IN_PROGRESS', 'COMPLETE');
export type AuditStatus = typeof AuditStatusSchema.Type;

const AuditTemplateRecordSchema = Schema.Struct({
  id: AuditTemplateIdSchema,
  data: ReplayUserflowAuditSchema,
  createAt: Schema.DateFromSelf,
  updatedAt: Schema.DateFromSelf,
});
type AuditTemplateRecord = typeof AuditTemplateRecordSchema.Type;

const AuditRunRecordSchema = Schema.Struct({
  id: AuditRunIdSchema,
  templateId: AuditTemplateIdSchema,
  data: ReplayUserflowAuditSchema,
  status: AuditStatusSchema,
  createdAt: Schema.DateFromSelf,
  updatedAt: Schema.DateFromSelf,
  startedAt: Schema.NullOr(Schema.DateFromSelf),
  completedAt: Schema.NullOr(Schema.DateFromSelf),
  durationMs: Schema.NullOr(Schema.Number),
});
export type AuditRunRecord = typeof AuditRunRecordSchema.Type;

const AuditResultStatusSchema = Schema.Literal('SUCCESS', 'FAILURE');
const AuditResultRecordSchema = Schema.Struct({
  runId: AuditRunIdSchema,
  data: Schema.Unknown,
  status: AuditResultStatusSchema,
  error: Schema.NullOr(Schema.Unknown),
  reportHtml: Schema.NullOr(Schema.String),
  createdAt: Schema.DateFromSelf,
});
type AuditResultRecord = typeof AuditResultRecordSchema.Type;

const AuditRunSummaryRecordSchema = Schema.Struct({
  id: AuditRunIdSchema,
  title: Schema.NonEmptyString,
  status: AuditStatusSchema,
  resultStatus: Schema.NullOr(AuditResultStatusSchema),
  queuePosition: Schema.NullOr(Schema.NonNegativeInt),
  createdAt: Schema.DateFromSelf,
  startedAt: Schema.NullOr(Schema.DateFromSelf),
  completedAt: Schema.NullOr(Schema.DateFromSelf),
  durationMs: Schema.NullOr(Schema.Number),
});
export type AuditRunSummaryRecord = typeof AuditRunSummaryRecordSchema.Type;

const AuditRunListCursorSchema = Schema.Struct({
  createdAtMs: Schema.NonNegativeInt,
  id: Schema.String,
});
export type AuditRunListCursor = typeof AuditRunListCursorSchema.Type;

export class AuditRepo extends Context.Tag('AuditRepo')<
  AuditRepo,
  {
    createTemplate: (audit: ReplayUserflowAudit) => Effect.Effect<AuditTemplateId, QueryError>;
    getTemplateById: (
      id: AuditTemplateId,
    ) => Effect.Effect<AuditTemplateRecord | null, QueryError | ParseResult.ParseError>;
    createRun: (templateId: AuditTemplateId) => Effect.Effect<AuditRunId, QueryError>;
    claimNextRun: () => Effect.Effect<AuditRunRecord | null, QueryError | ParseResult.ParseError>;
    hasScheduledRuns: () => Effect.Effect<boolean, QueryError>;
    markRunInProgress: (id: AuditRunId) => Effect.Effect<void, QueryError>;
    getQueuePosition: (id: AuditRunId) => Effect.Effect<number | null, QueryError | ParseResult.ParseError>;
    getRunSummaryById: (
      id: AuditRunId,
    ) => Effect.Effect<AuditRunSummaryRecord | null, QueryError | ParseResult.ParseError>;
    listRunsPage: (params: {
      limit: number;
      cursor: AuditRunListCursor | null;
      status: ReadonlyArray<AuditStatus> | null;
    }) => Effect.Effect<
      {
        items: ReadonlyArray<AuditRunSummaryRecord>;
        nextCursor: AuditRunListCursor | null;
      },
      QueryError | ParseResult.ParseError
    >;
    completeRun: (
      id: AuditRunId,
      result: { status: 'SUCCESS' | 'FAILURE'; data: unknown; error?: unknown; reportHtml?: string | null },
      durationMs: number,
    ) => Effect.Effect<void, QueryError>;
    getRunById: (id: AuditRunId) => Effect.Effect<AuditRunRecord | null, QueryError | ParseResult.ParseError>;
    getResultByRunId: (id: AuditRunId) => Effect.Effect<AuditResultRecord | null, QueryError | ParseResult.ParseError>;
  }
>() {}

const decodeAuditRunRecord = (run: {
  id: string;
  templateId: string;
  status: AuditStatus;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  durationMs: number | null;
  templateData: unknown;
}) =>
  Schema.decodeUnknown(AuditRunRecordSchema, { errors: 'all' })({
    id: run.id,
    templateId: run.templateId,
    data: run.templateData,
    status: run.status,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    durationMs: run.durationMs,
  });

const decodeAuditResultRecord = (result: {
  runId: string;
  status: AuditResultStatus;
  data: unknown;
  error: unknown;
  reportHtml: string | null;
  createdAt: Date;
}) =>
  Schema.decodeUnknown(AuditResultRecordSchema, { errors: 'all' })({
    runId: result.runId,
    status: result.status,
    data: result.data ?? null,
    error: result.error ?? null,
    reportHtml: result.reportHtml ?? null,
    createdAt: result.createdAt,
  });

const decodeAuditRunSummaryRecord = (run: {
  id: string;
  title: string;
  status: AuditStatus;
  resultStatus: AuditResultStatus | null;
  queuePosition: number | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  durationMs: number | null;
}) =>
  Schema.decodeUnknown(AuditRunSummaryRecordSchema, { errors: 'all' })({
    id: run.id,
    title: run.title,
    status: run.status,
    resultStatus: run.resultStatus,
    queuePosition: run.queuePosition,
    createdAt: run.createdAt,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    durationMs: run.durationMs,
  });

const resolveAuditTitle = (templateData: unknown): string => {
  if (templateData && typeof templateData === 'object') {
    const title = (templateData as { title?: unknown }).title;
    if (typeof title === 'string' && title.trim().length > 0) {
      return title;
    }
  }
  return 'Untitled audit';
};

export const AuditRepoLive = Layer.effect(
  AuditRepo,
  Effect.gen(function* () {
    const db = yield* DbClient;

    const createTemplate = Effect.fn('db.auditTemplate.create')(function* (audit: ReplayUserflowAudit) {
      const now = new Date(yield* Clock.currentTimeMillis);
      const id = randomUUID() as AuditTemplateId;

      yield* Effect.annotateCurrentSpan({
        'audit.title': audit.title,
        'audit.device': audit.device,
      });

      yield* db.run((client) =>
        client
          .insert(auditTemplateTable)
          .values({
            id,
            data: audit,
            createdAt: now,
            updatedAt: now,
          })
          .run(),
      );

      yield* Effect.annotateCurrentSpan({ 'audit.template_id': id });
      return id;
    });

    const getTemplateById = Effect.fn('db.auditTemplate.getById')(function* (id: AuditTemplateId) {
      yield* Effect.annotateCurrentSpan({ 'audit.template_id': id });
      const record = yield* db.run((client) =>
        client.select().from(auditTemplateTable).where(eq(auditTemplateTable.id, id)).get(),
      );

      if (!record) {
        return null;
      }

      return yield* Schema.decodeUnknown(AuditTemplateRecordSchema, { errors: 'all' })({
        id: record.id,
        data: record.data,
        createAt: record.createdAt,
        updatedAt: record.updatedAt,
      });
    });

    const createRun = Effect.fn('db.auditRun.create')(function* (templateId: AuditTemplateId) {
      const now = new Date(yield* Clock.currentTimeMillis);
      const id = randomUUID() as AuditRunId;

      yield* Effect.annotateCurrentSpan({ 'audit.template_id': templateId });

      yield* db.run((client) =>
        client
          .insert(auditRunTable)
          .values({
            id,
            templateId,
            status: 'SCHEDULED',
            createdAt: now,
            updatedAt: now,
          })
          .run(),
      );

      yield* Effect.annotateCurrentSpan({ 'audit.id': id });
      return id;
    });

    const claimNextRun = Effect.fn('db.auditRun.claimNext')(function* () {
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

    const hasScheduledRuns = Effect.fn('db.auditRun.hasScheduledRuns')(function* () {
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

    const markRunInProgress = (id: AuditRunId) =>
      Effect.gen(function* () {
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

    const getQueuePosition = Effect.fn('db.auditRun.getQueuePosition')(function* (id: AuditRunId) {
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

    const getRunSummaryById = Effect.fn('db.auditRun.getSummaryById')(function* (id: AuditRunId) {
      yield* Effect.annotateCurrentSpan({ 'audit.id': id });

      const row = yield* db.run((client) =>
        client
          .select({
            id: auditRunTable.id,
            status: auditRunTable.status,
            createdAt: auditRunTable.createdAt,
            startedAt: auditRunTable.startedAt,
            completedAt: auditRunTable.completedAt,
            durationMs: auditRunTable.durationMs,
            templateData: auditTemplateTable.data,
            resultStatus: auditResultTable.status,
          })
          .from(auditRunTable)
          .innerJoin(auditTemplateTable, eq(auditTemplateTable.id, auditRunTable.templateId))
          .leftJoin(auditResultTable, eq(auditResultTable.runId, auditRunTable.id))
          .where(eq(auditRunTable.id, id))
          .get(),
      );

      if (!row) {
        return null;
      }

      const queuePosition = row.status === 'SCHEDULED' ? yield* getQueuePosition(row.id as AuditRunId) : null;

      return yield* decodeAuditRunSummaryRecord({
        id: row.id,
        title: resolveAuditTitle(row.templateData),
        status: row.status,
        resultStatus: row.resultStatus ?? null,
        queuePosition: row.status === 'SCHEDULED' ? (queuePosition ?? 0) : null,
        createdAt: row.createdAt,
        startedAt: row.startedAt,
        completedAt: row.completedAt,
        durationMs: row.durationMs,
      });
    });

    const listRunsPage = Effect.fn('db.auditRun.listPage')(function* (params: {
      limit: number;
      cursor: AuditRunListCursor | null;
      status: ReadonlyArray<AuditStatus> | null;
    }) {
      const limit = Math.max(1, Math.min(params.limit, 100));
      const statusFilter =
        params.status && params.status.length > 0 ? inArray(auditRunTable.status, params.status) : null;
      const cursorFilter = params.cursor
        ? or(
            lt(auditRunTable.createdAt, new Date(params.cursor.createdAtMs)),
            and(
              eq(auditRunTable.createdAt, new Date(params.cursor.createdAtMs)),
              lt(auditRunTable.id, params.cursor.id),
            ),
          )
        : null;
      const whereClause =
        statusFilter && cursorFilter ? and(statusFilter, cursorFilter) : (statusFilter ?? cursorFilter);

      const rows = yield* db.run((client) => {
        const baseQuery = client
          .select({
            id: auditRunTable.id,
            status: auditRunTable.status,
            createdAt: auditRunTable.createdAt,
            startedAt: auditRunTable.startedAt,
            completedAt: auditRunTable.completedAt,
            durationMs: auditRunTable.durationMs,
            templateData: auditTemplateTable.data,
            resultStatus: auditResultTable.status,
          })
          .from(auditRunTable)
          .innerJoin(auditTemplateTable, eq(auditTemplateTable.id, auditRunTable.templateId))
          .leftJoin(auditResultTable, eq(auditResultTable.runId, auditRunTable.id))
          .orderBy(desc(auditRunTable.createdAt), desc(auditRunTable.id))
          .limit(limit + 1);

        return whereClause ? baseQuery.where(whereClause).all() : baseQuery.all();
      });

      const pageRows = rows.slice(0, limit);
      const items = yield* Effect.forEach(pageRows, (row) =>
        Effect.gen(function* () {
          const queuePosition = row.status === 'SCHEDULED' ? yield* getQueuePosition(row.id as AuditRunId) : null;

          return yield* decodeAuditRunSummaryRecord({
            id: row.id,
            title: resolveAuditTitle(row.templateData),
            status: row.status,
            resultStatus: row.resultStatus ?? null,
            queuePosition: row.status === 'SCHEDULED' ? (queuePosition ?? 0) : null,
            createdAt: row.createdAt,
            startedAt: row.startedAt,
            completedAt: row.completedAt,
            durationMs: row.durationMs,
          });
        }),
      );

      const hasMore = rows.length > limit;
      const nextCursor =
        hasMore && pageRows.length > 0
          ? {
              createdAtMs: pageRows[pageRows.length - 1].createdAt.getTime(),
              id: pageRows[pageRows.length - 1].id,
            }
          : null;

      return {
        items,
        nextCursor,
      };
    });

    const completeRun = (
      id: AuditRunId,
      result: { status: 'SUCCESS' | 'FAILURE'; data: unknown; error?: unknown; reportHtml?: string | null },
      durationMs: number,
    ) =>
      Effect.gen(function* () {
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

    const getRunById = Effect.fn('db.auditRun.getById')(function* (id: AuditRunId) {
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

    const getResultByRunId = Effect.fn('db.auditResult.getByRunId')(function* (id: AuditRunId) {
      yield* Effect.annotateCurrentSpan({ 'audit.id': id });

      const record = yield* db.run((client) =>
        client
          .select({
            runId: auditResultTable.runId,
            status: auditResultTable.status,
            data: auditResultTable.data,
            error: auditResultTable.error,
            reportHtml: auditResultTable.reportHtml,
            createdAt: auditResultTable.createdAt,
          })
          .from(auditResultTable)
          .where(eq(auditResultTable.runId, id))
          .get(),
      );

      if (!record) {
        return null;
      }

      const decoded = yield* decodeAuditResultRecord(record);
      yield* Effect.annotateCurrentSpan({ 'audit.result_status': decoded.status });
      return decoded;
    });

    return {
      createTemplate,
      getTemplateById,
      createRun,
      claimNextRun,
      hasScheduledRuns,
      markRunInProgress,
      getQueuePosition,
      getRunSummaryById,
      listRunsPage,
      completeRun,
      getRunById,
      getResultByRunId,
    };
  }),
);
