import { Schema } from 'effect';

// Keep the same brand label as persistence to stay type-compatible across layers.
export const AuditId = Schema.NonEmptyString.pipe(Schema.brand('AuditRunId'));

export type AuditIdType = typeof AuditId.Type;
export const AuditRunStatusSchema = Schema.Literals(['SCHEDULED', 'IN_PROGRESS', 'COMPLETE']);
export const AuditResultStatusSchema = Schema.Literals(['SUCCESS', 'FAILURE']);

export const AuditErrorSchema = Schema.Struct({
  name: Schema.String,
  message: Schema.String,
  stack: Schema.String,
});

export class AuditNotFoundError extends Schema.TaggedErrorClass<AuditNotFoundError>()(
  'AuditNotFoundError',
  { id: AuditId },
  { httpApiStatus: 404 },
) {}

const ApiErrorDetailsSchema = Schema.optional(Schema.Record(Schema.String, Schema.Unknown));

export class AuditHistoryInvalidQueryError extends Schema.TaggedErrorClass<AuditHistoryInvalidQueryError>()(
  'AuditHistoryInvalidQueryError',
  {
    code: Schema.Literal('INVALID_QUERY'),
    message: Schema.String,
    details: ApiErrorDetailsSchema,
  },
  { httpApiStatus: 400 },
) {}

export class AuditHistoryInvalidCursorError extends Schema.TaggedErrorClass<AuditHistoryInvalidCursorError>()(
  'AuditHistoryInvalidCursorError',
  {
    code: Schema.Literal('INVALID_CURSOR'),
    message: Schema.String,
    details: ApiErrorDetailsSchema,
  },
  { httpApiStatus: 400 },
) {}

export class AuditHistoryInternalError extends Schema.TaggedErrorClass<AuditHistoryInternalError>()(
  'AuditHistoryInternalError',
  {
    code: Schema.Literal('INTERNAL_ERROR'),
    message: Schema.String,
    details: ApiErrorDetailsSchema,
  },
  { httpApiStatus: 500 },
) {}
