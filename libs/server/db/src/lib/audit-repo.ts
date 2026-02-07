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
      db
        .run((c) => c.auditTemplate.create({ data: { data: audit as Prisma.InputJsonValue } }))
        .pipe(Effect.map((record) => record.id as AuditTemplateId));

    const getTemplateById = (id: AuditTemplateId) =>
      db
        .run((c) => c.auditTemplate.findUnique({ where: { id } }))
        .pipe(
          Effect.flatMap((record) => {
            if (!record) return Effect.succeed(null);
            return Schema.decodeUnknown(AuditTemplateRecordSchema, { errors: 'all' })({
              id: record.id,
              data: record.data,
              createAt: record.createdAt,
              updatedAt: record.updatedAt,
            });
          }),
        );

    const createRun = (templateId: AuditTemplateId) =>
      db.run((c) => c.auditRun.create({ data: { templateId } })).pipe(Effect.map((record) => record.id as AuditRunId));

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

        return claimed ? yield* decodeAuditRunRecord(claimed) : null;
      });

    const markRunInProgress = (id: AuditRunId) =>
      Effect.gen(function* () {
        const now = new Date(yield* Clock.currentTimeMillis);
        yield* db.run((c) =>
          c.auditRun.update({
            where: { id },
            data: { status: 'IN_PROGRESS', startedAt: now },
          }),
        );
      }).pipe(Effect.asVoid);

    const getQueuePosition = (id: AuditRunId) =>
      Effect.gen(function* () {
        const run = yield* db.run((c) =>
          c.auditRun.findUnique({
            where: { id },
            select: { id: true, createdAt: true, status: true },
          }),
        );
        if (!run) return null;
        if (run.status !== 'SCHEDULED') return 0;

        return yield* db.run((c) =>
          c.auditRun.count({
            where: {
              status: 'SCHEDULED',
              OR: [{ createdAt: { lt: run.createdAt } }, { createdAt: run.createdAt, id: { lt: run.id } }],
            },
          }),
        );
      });

    const completeRun = (
      id: AuditRunId,
      result: { status: 'SUCCESS' | 'FAILURE'; data: unknown; error?: unknown },
      durationMs: number,
    ) =>
      Effect.gen(function* () {
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
      }).pipe(Effect.asVoid);

    const getRunById = (id: AuditRunId) =>
      db
        .run((c) => c.auditRun.findUnique({ where: { id }, include: { template: true } }))
        .pipe(Effect.flatMap((record) => (record ? decodeAuditRunRecord(record) : Effect.succeed(null))));

    const getResultByRunId = (id: AuditRunId) =>
      db
        .run((c) => c.auditResult.findUnique({ where: { runId: id } }))
        .pipe(Effect.flatMap((record) => (record ? decodeAuditResultRecord(record) : Effect.succeed(null))));

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
