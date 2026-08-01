import { HttpApiEndpoint, HttpApiError, HttpApiSchema } from 'effect/unstable/httpapi';
import { Schema } from 'effect';

import { AuditErrorSchema, AuditId, AuditNotFoundError, AuditResultStatusSchema } from '../Audit';

const AuditResultSuccessSchema = Schema.Struct({
  status: AuditResultStatusSchema.pick(['SUCCESS']),
  result: Schema.Unknown,
});

const AuditResultFailureSchema = Schema.Struct({
  status: AuditResultStatusSchema.pick(['FAILURE']),
  error: AuditErrorSchema,
});

const AuditResultSchema = Schema.Union([AuditResultSuccessSchema, AuditResultFailureSchema]);

export const resultByIdEndpoint = HttpApiEndpoint.get('resultById', '/:id/result', {
  params: { id: AuditId },
  success: AuditResultSchema,
  error: [HttpApiError.BadRequestNoContent, HttpApiError.NotFoundNoContent, AuditNotFoundError],
});

export const reportByIdEndpoint = HttpApiEndpoint.get('reportById', '/:id/report', {
  params: { id: AuditId },
  success: Schema.String.pipe(HttpApiSchema.asText({ contentType: 'text/html' })),
  error: [HttpApiError.BadRequestNoContent, HttpApiError.NotFoundNoContent, AuditNotFoundError],
});
