import { Clock, Context, Effect, Layer, ParseResult, Schema } from 'effect';
import { ReplayUserflowAudit, ReplayUserflowAuditSchema } from '@app-speed/shared-user-flow-replay/schema';
import { DbClient, QueryError } from './db';
import { type AuditResultStatus, Prisma } from '@prisma/client';

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
  createdAt: Schema.DateFromSelf,
});
type AuditResultRecord = typeof AuditResultRecordSchema.Type;

export class AuditRepo extends Context.Tag('AuditRepo')<
  AuditRepo,
  {
    createTemplate: (audit: ReplayUserflowAudit) => Effect.Effect<AuditTemplateId, QueryError>;
    getTemplateById: (
      id: AuditTemplateId,
    ) => Effect.Effect<AuditTemplateRecord | null, QueryError | ParseResult.ParseError>;
    createRun: (templateId: AuditTemplateId) => Effect.Effect<AuditRunId, QueryError>;
    claimNextRun: () => Effect.Effect<AuditRunRecord | null, QueryError | ParseResult.ParseError>;
    markRunInProgress: (id: AuditRunId) => Effect.Effect<void, QueryError>;
    getQueuePosition: (id: AuditRunId) => Effect.Effect<number | null, QueryError | ParseResult.ParseError>;
    completeRun: (
      id: AuditRunId,
      result: { status: 'SUCCESS' | 'FAILURE'; data: unknown; error?: unknown },
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
  template: { data: Prisma.JsonValue };
}) =>
  Schema.decodeUnknown(AuditRunRecordSchema, { errors: 'all' })({
    id: run.id,
    templateId: run.templateId,
    data: run.template.data,
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
  data: Prisma.JsonValue | null;
  error: Prisma.JsonValue | null;
  createdAt: Date;
}) =>
  Schema.decodeUnknown(AuditResultRecordSchema, { errors: 'all' })({
    runId: result.runId,
    status: result.status,
    data: result.data ?? null,
    error: result.error ?? null,
    createdAt: result.createdAt,
  });

export const AuditRepoLive = Layer.effect(
  AuditRepo,
  Effect.gen(function* () {
    const db = yield* DbClient;

    const createTemplate = (audit: ReplayUserflowAudit) =>
      Effect.gen(function* () {
        yield* Effect.annotateCurrentSpan({
          'audit.title': audit.title,
          'audit.device': audit.device,
        });
        const record = yield* db.run((c) => c.auditTemplate.create({ data: { data: audit as Prisma.InputJsonValue } }));
        yield* Effect.annotateCurrentSpan({ 'audit.template_id': record.id });
        return record.id as AuditTemplateId;
      }).pipe(Effect.withSpan('db.auditTemplate.create'));

    const getTemplateById = (id: AuditTemplateId) =>
      Effect.gen(function* () {
        yield* Effect.annotateCurrentSpan({ 'audit.template_id': id });
        const record = yield* db.run((c) => c.auditTemplate.findUnique({ where: { id } }));
        if (!record) return null;
        return yield* Schema.decodeUnknown(AuditTemplateRecordSchema, { errors: 'all' })({
          id: record.id,
          data: record.data,
          createAt: record.createdAt,
          updatedAt: record.updatedAt,
        });
      }).pipe(Effect.withSpan('db.auditTemplate.getById'));

    const createRun = (templateId: AuditTemplateId) =>
      Effect.gen(function* () {
        yield* Effect.annotateCurrentSpan({ 'audit.template_id': templateId });
        const record = yield* db.run((c) => c.auditRun.create({ data: { templateId } }));
        yield* Effect.annotateCurrentSpan({ 'audit.id': record.id });
        return record.id as AuditRunId;
      }).pipe(Effect.withSpan('db.auditRun.create'));

    const claimNextRun = () =>
      Effect.gen(function* () {
        const now = new Date(yield* Clock.currentTimeMillis);
        const claimed = yield* db.run((c) =>
          c.$transaction(async (tx) => {
            const next = await tx.auditRun.findFirst({
              where: { status: 'SCHEDULED' },
              orderBy: { createdAt: 'asc' },
              include: { template: true },
            });

            if (!next) return null;

            const updated = await tx.auditRun.updateMany({
              where: { id: next.id, status: 'SCHEDULED' },
              data: { status: 'IN_PROGRESS', startedAt: now },
            });

            if (updated.count === 0) return null;

            const claimed = await tx.auditRun.findUnique({
              where: { id: next.id },
              include: { template: true },
            });

            return claimed ?? null;
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
      }).pipe(Effect.withSpan('db.auditRun.claimNext'));

    const markRunInProgress = (id: AuditRunId) =>
      Effect.gen(function* () {
        yield* Effect.annotateCurrentSpan({ 'audit.id': id });
        const now = new Date(yield* Clock.currentTimeMillis);
        yield* db.run((c) =>
          c.auditRun.update({
            where: { id },
            data: { status: 'IN_PROGRESS', startedAt: now },
          }),
        );
      }).pipe(Effect.withSpan('db.auditRun.markInProgress'), Effect.asVoid);

    const getQueuePosition = (id: AuditRunId) =>
      Effect.gen(function* () {
        yield* Effect.annotateCurrentSpan({ 'audit.id': id });
        const run = yield* db.run((c) =>
          c.auditRun.findUnique({
            where: { id },
            select: { id: true, createdAt: true, status: true },
          }),
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

        const position = yield* db.run((c) =>
          c.auditRun.count({
            where: {
              status: 'SCHEDULED',
              OR: [{ createdAt: { lt: run.createdAt } }, { createdAt: run.createdAt, id: { lt: run.id } }],
            },
          }),
        );
        yield* Effect.annotateCurrentSpan({
          'audit.status': run.status,
          'queue.position': position,
        });
        return position;
      }).pipe(Effect.withSpan('db.auditRun.getQueuePosition'));

    const completeRun = (
      id: AuditRunId,
      result: { status: 'SUCCESS' | 'FAILURE'; data: unknown; error?: unknown },
      durationMs: number,
    ) =>
      Effect.gen(function* () {
        yield* Effect.annotateCurrentSpan({
          'audit.id': id,
          'audit.status': result.status,
          'audit.duration_ms': durationMs,
        });
        const now = new Date(yield* Clock.currentTimeMillis);
        yield* db.run((c) =>
          c.$transaction(async (tx) => {
            await tx.auditRun.update({
              where: { id },
              data: {
                status: 'COMPLETE',
                completedAt: now,
                durationMs,
              },
            });

            await tx.auditResult.create({
              data: {
                runId: id,
                status: result.status,
                data: result.data == null ? Prisma.JsonNull : (result.data as Prisma.InputJsonValue),
                error: result.error == null ? Prisma.JsonNull : (result.error as Prisma.InputJsonValue),
              },
            });
          }),
        );
      }).pipe(Effect.withSpan('db.auditRun.complete'), Effect.asVoid);

    const getRunById = (id: AuditRunId) =>
      Effect.gen(function* () {
        yield* Effect.annotateCurrentSpan({ 'audit.id': id });
        const record = yield* db.run((c) => c.auditRun.findUnique({ where: { id }, include: { template: true } }));
        if (!record) return null;
        const decoded = yield* decodeAuditRunRecord(record);
        yield* Effect.annotateCurrentSpan({ 'audit.status': decoded.status });
        return decoded;
      }).pipe(Effect.withSpan('db.auditRun.getById'));

    const getResultByRunId = (id: AuditRunId) =>
      Effect.gen(function* () {
        yield* Effect.annotateCurrentSpan({ 'audit.id': id });
        const record = yield* db.run((c) => c.auditResult.findUnique({ where: { runId: id } }));
        if (!record) return null;
        const decoded = yield* decodeAuditResultRecord(record);
        yield* Effect.annotateCurrentSpan({ 'audit.result_status': decoded.status });
        return decoded;
      }).pipe(Effect.withSpan('db.auditResult.getByRunId'));

    return {
      createTemplate,
      getTemplateById,
      createRun,
      claimNextRun,
      markRunInProgress,
      getQueuePosition,
      completeRun,
      getRunById,
      getResultByRunId,
    };
  }),
);
