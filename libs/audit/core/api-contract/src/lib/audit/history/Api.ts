import { HttpApiEndpoint } from '@effect/platform';
import { Schema } from 'effect';

import { AuditKindSchema } from '@app-speed/audit/core/domain';

import {
  AuditHistoryInternalError,
  AuditHistoryInvalidCursorError,
  AuditHistoryInvalidQueryError,
  AuditId,
  AuditResultStatusSchema,
  AuditRunStatusSchema,
} from '../Audit';

export const AuditHistoryQuerySchema = Schema.Struct({
  limit: Schema.optional(Schema.String),
  cursor: Schema.optional(Schema.String),
  status: Schema.optional(Schema.Union(Schema.String, Schema.Array(Schema.String))),
});

export const AuditHistoryItemSchema = Schema.Struct({
  kind: AuditKindSchema,
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

export const AuditHistoryPageSchema = Schema.Struct({
  items: Schema.Array(AuditHistoryItemSchema),
  nextCursor: Schema.NullOr(Schema.String),
  limit: Schema.NonNegativeInt,
});

export const historyEndpoint = HttpApiEndpoint.get('history', '/history')
  .setUrlParams(AuditHistoryQuerySchema)
  .addSuccess(AuditHistoryPageSchema)
  .addError(AuditHistoryInvalidQueryError)
  .addError(AuditHistoryInvalidCursorError)
  .addError(AuditHistoryInternalError);
