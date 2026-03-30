import { HttpApiError } from '@effect/platform';
import { Schema } from 'effect';

import type { ReplayUserflowAudit } from './audit.schema';
import { ReplayUserflowAuditSchema } from './audit.schema';

export const ScheduleAuditRequestSchema = ReplayUserflowAuditSchema;
export type ScheduleAuditRequest = ReplayUserflowAudit;

export const ScheduleAuditResponseSchema = Schema.Struct({
  auditId: Schema.String,
  auditQueuePosition: Schema.NonNegativeInt,
});

export type ScheduleAuditResponse = typeof ScheduleAuditResponseSchema.Type;

export const ScheduleAuditDecodeErrorResponseSchema = HttpApiError.HttpApiDecodeError;
export type ScheduleAuditDecodeErrorResponse = typeof ScheduleAuditDecodeErrorResponseSchema.Type;
export type ScheduleAuditDecodeErrorIssue = ScheduleAuditDecodeErrorResponse['issues'][number];

export const ScheduleAuditBadRequestResponseSchema = HttpApiError.BadRequest;
export type ScheduleAuditBadRequestResponse = typeof ScheduleAuditBadRequestResponseSchema.Type;

export const ScheduleAuditErrorResponseSchema = Schema.Union(
  ScheduleAuditDecodeErrorResponseSchema,
  ScheduleAuditBadRequestResponseSchema,
);

export type ScheduleAuditErrorResponse = typeof ScheduleAuditErrorResponseSchema.Type;
