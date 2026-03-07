import { HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema } from '@effect/platform';
import { Schema } from 'effect';
import { ReplayUserflowAuditSchema } from '@app-speed/shared-user-flow-replay/schema';
import {
  AuditId,
  AuditNotFoundError,
  AuditRunSummaryNotFoundError,
  AuditRunsInternalError,
  AuditRunsInvalidCursorError,
  AuditRunsInvalidQueryError,
} from './Audit';

export const AuditRunStatusSchema = Schema.Literal('SCHEDULED', 'IN_PROGRESS', 'COMPLETE');
export const AuditResultStatusSchema = Schema.Literal('SUCCESS', 'FAILURE');

const AuditErrorSchema = Schema.Struct({
  name: Schema.String,
  message: Schema.String,
  stack: Schema.String,
});

const AuditResultSuccessSchema = Schema.Struct({
  status: AuditResultStatusSchema.pipe(Schema.pickLiteral('SUCCESS')),
  result: Schema.Unknown,
});

const AuditResultFailureSchema = Schema.Struct({
  status: AuditResultStatusSchema.pipe(Schema.pickLiteral('FAILURE')),
  error: AuditErrorSchema,
});

const AuditResultSchema = Schema.Union(AuditResultSuccessSchema, AuditResultFailureSchema);

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

export class AuditApiGroup extends HttpApiGroup.make('audit')
  .add(
    HttpApiEndpoint.post('schedule', '/schedule')
      .setPayload(ReplayUserflowAuditSchema)
      .addSuccess(Schema.Struct({ auditId: AuditId, auditQueuePosition: Schema.NonNegativeInt }))
      .addError(HttpApiError.BadRequest),
  )
  .add(
    HttpApiEndpoint.get('findById', '/:id')
      .setPath(Schema.Struct({ id: AuditId }))
      .addSuccess(Schema.Struct({ status: AuditRunStatusSchema }))
      .addError(HttpApiError.BadRequest)
      .addError(AuditNotFoundError),
  )
  .add(
    HttpApiEndpoint.get('resultById', '/:id/result')
      .setPath(Schema.Struct({ id: AuditId }))
      .addSuccess(AuditResultSchema)
      .addError(HttpApiError.BadRequest)
      .addError(HttpApiError.NotFound)
      .addError(AuditNotFoundError),
  )
  .add(
    HttpApiEndpoint.get('listRuns', '/runs')
      .setUrlParams(AuditRunsQuerySchema)
      .addSuccess(AuditRunsPageSchema)
      .addError(AuditRunsInvalidQueryError)
      .addError(AuditRunsInvalidCursorError)
      .addError(AuditRunsInternalError),
  )
  .add(
    HttpApiEndpoint.get('runById', '/runs/:id')
      .setPath(Schema.Struct({ id: AuditId }))
      .addSuccess(AuditRunSummarySchema)
      .addError(AuditRunSummaryNotFoundError)
      .addError(AuditRunsInternalError),
  )
  .add(
    HttpApiEndpoint.get('watchById', '/:id/events')
      .setPath(Schema.Struct({ id: AuditId }))
      .addSuccess(
        Schema.Uint8ArrayFromSelf.pipe(
          HttpApiSchema.withEncoding({ kind: 'Uint8Array', contentType: 'text/event-stream' }),
        ),
      )
      .addError(HttpApiError.BadRequest)
      .addError(AuditNotFoundError),
  )
  .prefix('/audit') {}
