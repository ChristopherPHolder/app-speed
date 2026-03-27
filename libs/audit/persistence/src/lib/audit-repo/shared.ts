import { Schema } from 'effect';

import { ReplayUserflowAuditSchema } from '@app-speed/audit/contracts';

export const AuditTemplateIdSchema = Schema.NonEmptyString.pipe(Schema.brand('AuditTemplateId'));
export type AuditTemplateId = typeof AuditTemplateIdSchema.Type;

export const AuditRunIdSchema = Schema.NonEmptyString.pipe(Schema.brand('AuditRunId'));
export type AuditRunId = typeof AuditRunIdSchema.Type;

export const AuditStatusSchema = Schema.Literal('SCHEDULED', 'IN_PROGRESS', 'COMPLETE');
export type AuditStatus = typeof AuditStatusSchema.Type;

const AuditTemplateRecordSchema = Schema.Struct({
  id: AuditTemplateIdSchema,
  data: ReplayUserflowAuditSchema,
  createAt: Schema.DateFromSelf,
  updatedAt: Schema.DateFromSelf,
});
export type AuditTemplateRecord = typeof AuditTemplateRecordSchema.Type;

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

export const AuditResultStatusSchema = Schema.Literal('SUCCESS', 'FAILURE');
export type AuditResultStatus = typeof AuditResultStatusSchema.Type;

const AuditResultRecordSchema = Schema.Struct({
  runId: AuditRunIdSchema,
  data: Schema.Unknown,
  status: AuditResultStatusSchema,
  error: Schema.NullOr(Schema.Unknown),
  reportHtml: Schema.NullOr(Schema.String),
  createdAt: Schema.DateFromSelf,
});
export type AuditResultRecord = typeof AuditResultRecordSchema.Type;

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

export const AuditRunListCursorSchema = Schema.Struct({
  createdAtMs: Schema.NonNegativeInt,
  id: Schema.String,
});
export type AuditRunListCursor = typeof AuditRunListCursorSchema.Type;

export const decodeAuditTemplateRecord = (template: {
  id: string;
  data: unknown;
  createAt: Date;
  updatedAt: Date;
}) => Schema.decodeUnknown(AuditTemplateRecordSchema, { errors: 'all' })(template);

export const decodeAuditRunRecord = (run: {
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

export const decodeAuditResultRecord = (result: {
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

export const decodeAuditRunSummaryRecord = (run: {
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

export const resolveAuditTitle = (templateData: unknown): string => {
  if (templateData && typeof templateData === 'object') {
    const title = (templateData as { title?: unknown }).title;
    if (typeof title === 'string' && title.trim().length > 0) {
      return title;
    }
  }
  return 'Untitled audit';
};
