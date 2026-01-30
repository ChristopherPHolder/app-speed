import { HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema } from '@effect/platform';
import { Schema } from 'effect';
import { ReplayUserflowAuditSchema } from '@app-speed/shared-user-flow-replay/schema';
import { AuditId, AuditNotFoundError } from './Audit';

const ScheduleAuditApiEndpoint = HttpApiEndpoint.post('schedule', '/schedule')
  .setPayload(ReplayUserflowAuditSchema)
  .addSuccess(Schema.Struct({ auditId: AuditId, auditQueuePosition: Schema.NonNegativeInt }))
  .addError(HttpApiError.BadRequest);

export class AuditApiGroup extends HttpApiGroup.make('audit')
  .add(ScheduleAuditApiEndpoint)
  .add(
    HttpApiEndpoint.get('findById', '/:id')
      .setPath(Schema.Struct({ id: AuditId }))
      .addSuccess(Schema.Struct({ status: Schema.String }))
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
