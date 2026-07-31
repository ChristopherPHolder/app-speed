import { HttpApiSchema } from '@effect/platform';
import { Schema } from 'effect';

// Keep the same brand label as persistence to stay type-compatible across layers.
export const AuditId = Schema.NonEmptyString.pipe(Schema.brand('AuditRunId'));

export type AuditIdType = typeof AuditId.Type;
export const AuditRunStatusSchema = Schema.Literal('SCHEDULED', 'IN_PROGRESS', 'COMPLETE');
export const AuditResultStatusSchema = Schema.Literal('SUCCESS', 'FAILURE');

export const AuditErrorSchema = Schema.Struct({
  name: Schema.String,
  message: Schema.String,
  stack: Schema.String,
});

export class AuditNotFoundError extends Schema.TaggedError<AuditNotFoundError>()(
  'AuditNotFoundError',
  { id: AuditId },
  HttpApiSchema.annotations({ status: 404 }),
) {}

const ApiErrorDetailsSchema = Schema.optional(
  Schema.Record({
    key: Schema.String,
    value: Schema.Unknown,
  }),
);

export class AuditHistoryInvalidQueryError extends Schema.TaggedError<AuditHistoryInvalidQueryError>()(
  'AuditHistoryInvalidQueryError',
  {
    code: Schema.Literal('INVALID_QUERY'),
    message: Schema.String,
    details: ApiErrorDetailsSchema,
  },
  HttpApiSchema.annotations({ status: 400 }),
) {}

export class AuditHistoryInvalidCursorError extends Schema.TaggedError<AuditHistoryInvalidCursorError>()(
  'AuditHistoryInvalidCursorError',
  {
    code: Schema.Literal('INVALID_CURSOR'),
    message: Schema.String,
    details: ApiErrorDetailsSchema,
  },
  HttpApiSchema.annotations({ status: 400 }),
) {}

export class AuditHistoryInternalError extends Schema.TaggedError<AuditHistoryInternalError>()(
  'AuditHistoryInternalError',
  {
    code: Schema.Literal('INTERNAL_ERROR'),
    message: Schema.String,
    details: ApiErrorDetailsSchema,
  },
  HttpApiSchema.annotations({ status: 500 }),
) {}
