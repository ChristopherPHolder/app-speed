import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from '@effect/platform';
import { Schema } from 'effect';
import { ReplayUserflowAuditSchema } from '@app-speed/shared-user-flow-replay/schema';
import { AuditId } from './Audit';

const ScheduleAuditResponseSchema = Schema.Struct({
  auditId: AuditId,
  auditQueuePosition: Schema.NonNegativeInt,
});

export class AuditGroup extends HttpApiGroup.make('audit')
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
      .addError(HttpApiError.NotFound),
  )
  .prefix('/audit') {}
