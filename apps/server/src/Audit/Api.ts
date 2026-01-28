import { HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema } from '@effect/platform';
import { Schema, Stream } from 'effect';
import { ReplayUserflowAuditSchema } from '@app-speed/shared-user-flow-replay/schema';
import { AuditId, AuditNotFoundError } from './Audit';

const ScheduleAuditResponseSchema = Schema.Struct({
  auditId: AuditId,
  auditQueuePosition: Schema.NonNegativeInt,
});
export class AuditApiGroup extends HttpApiGroup.make('audit')
  .add(
    HttpApiEndpoint.post('schedule', '/schedule')
      .setPayload(ReplayUserflowAuditSchema)
      .addSuccess(ScheduleAuditResponseSchema)
      .addError(HttpApiError.BadRequest),
  )
  .add(
    HttpApiEndpoint.get('findById', '/:id')
      .setPath(Schema.Struct({ id: AuditId }))
      .addSuccess(Schema.String)
      .addError(HttpApiError.BadRequest)
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
      .addError(HttpApiError.BadRequest),
  )
  .prefix('/audit') {}
