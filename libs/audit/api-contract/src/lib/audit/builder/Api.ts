import { HttpApiEndpoint, HttpApiError, HttpApiSchema } from '@effect/platform';
import { Schema } from 'effect';

import { AuditId, AuditNotFoundError, AuditRunStatusSchema } from '../Audit';
import { AuditAuthoringSchema } from '@app-speed/audit/domain';

export const scheduleEndpoint = HttpApiEndpoint.post('schedule', '/schedule')
  .setPayload(AuditAuthoringSchema)
  .addSuccess(
    Schema.Struct({
      auditId: Schema.String,
      auditQueuePosition: Schema.NonNegativeInt,
    }),
  )
  .addError(HttpApiError.HttpApiDecodeError)
  .addError(HttpApiError.BadRequest);

export const findByIdEndpoint = HttpApiEndpoint.get('findById', '/:id')
  .setPath(Schema.Struct({ id: AuditId }))
  .addSuccess(Schema.Struct({ status: AuditRunStatusSchema }))
  .addError(HttpApiError.BadRequest)
  .addError(AuditNotFoundError);

export const watchByIdEndpoint = HttpApiEndpoint.get('watchById', '/:id/events')
  .setPath(Schema.Struct({ id: AuditId }))
  .addSuccess(
    Schema.Uint8ArrayFromSelf.pipe(
      HttpApiSchema.withEncoding({ kind: 'Uint8Array', contentType: 'text/event-stream' }),
    ),
  )
  .addError(HttpApiError.BadRequest)
  .addError(AuditNotFoundError);
