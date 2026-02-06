import { HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema } from '@effect/platform';
import { Schema } from 'effect';
import { ReplayUserflowAuditSchema } from '@app-speed/shared-user-flow-replay/schema';
import { AuditId, AuditNotFoundError } from './Audit';

const AuditRunStatusSchema = Schema.Literal('SCHEDULED', 'IN_PROGRESS', 'COMPLETE');
const AuditResultStatusSchema = Schema.Literal('SUCCESS', 'FAILURE');
const AuditResultSchema = Schema.Struct({
  status: AuditResultStatusSchema,
  result: Schema.Unknown,
  error: Schema.optional(Schema.Unknown),
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
