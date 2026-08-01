import { HttpApiEndpoint, HttpApiError, HttpApiSchema } from 'effect/unstable/httpapi';
import { Schema } from 'effect';

import { AuditId, AuditNotFoundError, AuditRunStatusSchema } from '../Audit';

export const findByIdEndpoint = HttpApiEndpoint.get('findById', '/:id', {
  params: { id: AuditId },
  success: Schema.Struct({ status: AuditRunStatusSchema }),
  error: [HttpApiError.BadRequestNoContent, AuditNotFoundError],
});

export const watchByIdEndpoint = HttpApiEndpoint.get('watchById', '/:id/events', {
  params: { id: AuditId },
  success: Schema.Uint8Array.pipe(HttpApiSchema.asUint8Array({ contentType: 'text/event-stream' })),
  error: [HttpApiError.BadRequestNoContent, AuditNotFoundError],
});
