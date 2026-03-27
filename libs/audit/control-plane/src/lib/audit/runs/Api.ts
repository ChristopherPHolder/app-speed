import { HttpApiEndpoint } from '@effect/platform';
import { Schema } from 'effect';

import {
  AuditId,
  AuditResultStatusSchema,
  AuditRunStatusSchema,
  AuditRunSummaryNotFoundError,
  AuditRunsInternalError,
  AuditRunsInvalidCursorError,
  AuditRunsInvalidQueryError,
} from '../Audit.js';

export const AuditRunsQuerySchema = Schema.Struct({
  limit: Schema.optional(Schema.String),
  cursor: Schema.optional(Schema.String),
  status: Schema.optional(Schema.Union(Schema.String, Schema.Array(Schema.String))),
});

export const AuditRunSummarySchema = Schema.Struct({
  auditId: AuditId,
  title: Schema.String,
  status: AuditRunStatusSchema,
  resultStatus: Schema.NullOr(AuditResultStatusSchema),
  queuePosition: Schema.NullOr(Schema.NonNegativeInt),
  createdAt: Schema.String,
  startedAt: Schema.NullOr(Schema.String),
  completedAt: Schema.NullOr(Schema.String),
  durationMs: Schema.NullOr(Schema.Number),
});

const AuditRunsPageSchema = Schema.Struct({
  items: Schema.Array(AuditRunSummarySchema),
  nextCursor: Schema.NullOr(Schema.String),
  limit: Schema.NonNegativeInt,
});

export const listRunsEndpoint = HttpApiEndpoint.get('listRuns', '/runs')
  .setUrlParams(AuditRunsQuerySchema)
  .addSuccess(AuditRunsPageSchema)
  .addError(AuditRunsInvalidQueryError)
  .addError(AuditRunsInvalidCursorError)
  .addError(AuditRunsInternalError);

export const runByIdEndpoint = HttpApiEndpoint.get('runById', '/runs/:id')
  .setPath(Schema.Struct({ id: AuditId }))
  .addSuccess(AuditRunSummarySchema)
  .addError(AuditRunSummaryNotFoundError)
  .addError(AuditRunsInternalError);
