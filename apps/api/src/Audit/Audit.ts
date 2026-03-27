import { HttpApiSchema } from '@effect/platform';
import { Schema } from 'effect';

import { AuditRunIdSchema } from '@app-speed/audit/persistence';

export const AuditId = AuditRunIdSchema;

export type AuditIdType = typeof AuditId.Type;

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

export class AuditRunsInvalidQueryError extends Schema.TaggedError<AuditRunsInvalidQueryError>()(
  'AuditRunsInvalidQueryError',
  {
    code: Schema.Literal('INVALID_QUERY'),
    message: Schema.String,
    details: ApiErrorDetailsSchema,
  },
  HttpApiSchema.annotations({ status: 400 }),
) {}

export class AuditRunsInvalidCursorError extends Schema.TaggedError<AuditRunsInvalidCursorError>()(
  'AuditRunsInvalidCursorError',
  {
    code: Schema.Literal('INVALID_CURSOR'),
    message: Schema.String,
    details: ApiErrorDetailsSchema,
  },
  HttpApiSchema.annotations({ status: 400 }),
) {}

export class AuditRunSummaryNotFoundError extends Schema.TaggedError<AuditRunSummaryNotFoundError>()(
  'AuditRunSummaryNotFoundError',
  {
    code: Schema.Literal('RUN_NOT_FOUND'),
    message: Schema.String,
    details: ApiErrorDetailsSchema,
  },
  HttpApiSchema.annotations({ status: 404 }),
) {}

export class AuditRunsInternalError extends Schema.TaggedError<AuditRunsInternalError>()(
  'AuditRunsInternalError',
  {
    code: Schema.Literal('INTERNAL_ERROR'),
    message: Schema.String,
    details: ApiErrorDetailsSchema,
  },
  HttpApiSchema.annotations({ status: 500 }),
) {}
