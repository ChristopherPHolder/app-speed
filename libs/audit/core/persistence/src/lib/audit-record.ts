import { Schema } from 'effect';

import { AuditKindSchema } from '@app-speed/audit/core/domain';

export const AuditTemplateIdSchema = Schema.NonEmptyString.pipe(Schema.brand('AuditTemplateId'));
export type AuditTemplateId = typeof AuditTemplateIdSchema.Type;

export const AuditRunIdSchema = Schema.NonEmptyString.pipe(Schema.brand('AuditRunId'));
export type AuditRunId = typeof AuditRunIdSchema.Type;

export const AuditStatusSchema = Schema.Literals(['SCHEDULED', 'IN_PROGRESS', 'COMPLETE']);
export type AuditStatus = typeof AuditStatusSchema.Type;

const AuditTemplateRecordSchema = Schema.Struct({
  id: AuditTemplateIdSchema,
  kind: AuditKindSchema,
  title: Schema.NonEmptyString,
  createAt: Schema.Date,
  updatedAt: Schema.Date,
});
export type AuditTemplateRecord = typeof AuditTemplateRecordSchema.Type;

const AuditRunRecordSchema = Schema.Struct({
  id: AuditRunIdSchema,
  templateId: AuditTemplateIdSchema,
  kind: AuditKindSchema,
  status: AuditStatusSchema,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
  startedAt: Schema.NullOr(Schema.Date),
  completedAt: Schema.NullOr(Schema.Date),
  durationMs: Schema.NullOr(Schema.Number),
});
export type AuditRunRecord = typeof AuditRunRecordSchema.Type;

export const AuditResultStatusSchema = Schema.Literals(['SUCCESS', 'FAILURE']);
export type AuditResultStatus = typeof AuditResultStatusSchema.Type;

const NonNegativeIntSchema = Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0));

const AuditResultRecordSchema = Schema.Struct({
  id: Schema.NonEmptyString,
  runId: AuditRunIdSchema,
  status: AuditResultStatusSchema,
  error: Schema.NullOr(Schema.Unknown),
  createdAt: Schema.Date,
});
export type AuditResultRecord = typeof AuditResultRecordSchema.Type;

const AuditRunSummaryRecordSchema = Schema.Struct({
  id: AuditRunIdSchema,
  kind: AuditKindSchema,
  title: Schema.NonEmptyString,
  status: AuditStatusSchema,
  resultStatus: Schema.NullOr(AuditResultStatusSchema),
  queuePosition: Schema.NullOr(NonNegativeIntSchema),
  createdAt: Schema.Date,
  startedAt: Schema.NullOr(Schema.Date),
  completedAt: Schema.NullOr(Schema.Date),
  durationMs: Schema.NullOr(Schema.Number),
});
export type AuditRunSummaryRecord = typeof AuditRunSummaryRecordSchema.Type;

export const AuditRunListCursorSchema = Schema.Struct({
  createdAtMs: NonNegativeIntSchema,
  id: Schema.String,
});
export type AuditRunListCursor = typeof AuditRunListCursorSchema.Type;

export const decodeAuditTemplateRecord = (template: {
  id: string;
  kind: string;
  title: string;
  createAt: Date;
  updatedAt: Date;
}) => Schema.decodeUnknownEffect(AuditTemplateRecordSchema, { errors: 'all' })(template);

export const decodeAuditRunRecord = (run: {
  id: string;
  templateId: string;
  status: AuditStatus;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  durationMs: number | null;
  kind: string;
}) =>
  Schema.decodeUnknownEffect(AuditRunRecordSchema, { errors: 'all' })({
    id: run.id,
    templateId: run.templateId,
    kind: run.kind,
    status: run.status,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    durationMs: run.durationMs,
  });

export const decodeAuditResultRecord = (result: {
  id: string;
  runId: string;
  status: AuditResultStatus;
  error: unknown;
  createdAt: Date;
}) =>
  Schema.decodeUnknownEffect(AuditResultRecordSchema, { errors: 'all' })({
    id: result.id,
    runId: result.runId,
    status: result.status,
    error: result.error ?? null,
    createdAt: result.createdAt,
  });

export const decodeAuditRunSummaryRecord = (run: {
  id: string;
  kind: string;
  title: string;
  status: AuditStatus;
  resultStatus: AuditResultStatus | null;
  queuePosition: number | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  durationMs: number | null;
}) =>
  Schema.decodeUnknownEffect(AuditRunSummaryRecordSchema, { errors: 'all' })({
    id: run.id,
    kind: run.kind,
    title: run.title,
    status: run.status,
    resultStatus: run.resultStatus,
    queuePosition: run.queuePosition,
    createdAt: run.createdAt,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    durationMs: run.durationMs,
  });
