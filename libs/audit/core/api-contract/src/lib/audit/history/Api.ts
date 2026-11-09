import { HttpApiEndpoint, HttpApiError } from 'effect/http-api';
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
  search: Schema.optional(Schema.String),
  outcome: Schema.optional(Schema.String),
  limit: Schema.optional(Schema.String),
  cursor: Schema.optional(Schema.String),
  status: Schema.optional(Schema.Union([Schema.String, Schema.Array(Schema.String)])),
});

export const AuditHistoryItemSchema = Schema.Struct({
  kind: AuditKindSchema,
  auditId: AuditId,
  title: Schema.String,
  /** `mcp` when an AI client (Claude, ChatGPT, …) scheduled the audit for the account. */
  source: Schema.Literals(['portal', 'mcp']),
  clientName: Schema.NullOr(Schema.String),
  status: AuditRunStatusSchema,
  resultStatus: Schema.NullOr(AuditResultStatusSchema),
  queuePosition: Schema.NullOr(Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0))),
  createdAt: Schema.String,
  startedAt: Schema.NullOr(Schema.String),
  completedAt: Schema.NullOr(Schema.String),
  durationMs: Schema.NullOr(Schema.Number),
});

export const AuditHistoryPageSchema = Schema.Struct({
  items: Schema.Array(AuditHistoryItemSchema),
  nextCursor: Schema.NullOr(Schema.String),
  limit: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
});

export const historyEndpoint = HttpApiEndpoint.get('history', '/history', {
  query: AuditHistoryQuerySchema,
  success: AuditHistoryPageSchema,
  error: [
    HttpApiError.ForbiddenNoContent,
    AuditHistoryInvalidQueryError,
    AuditHistoryInvalidCursorError,
    AuditHistoryInternalError,
  ],
});
