import { HttpApiEndpoint, HttpApiError, HttpApiSchema } from '@effect/platform';
import { Schema } from 'effect';

import { AuditErrorSchema, AuditId, AuditNotFoundError, AuditResultStatusSchema } from '../Audit.js';

const AuditResultSuccessSchema = Schema.Struct({
  status: AuditResultStatusSchema.pipe(Schema.pickLiteral('SUCCESS')),
  result: Schema.Unknown,
});

const AuditResultFailureSchema = Schema.Struct({
  status: AuditResultStatusSchema.pipe(Schema.pickLiteral('FAILURE')),
  error: AuditErrorSchema,
});

const AuditResultSchema = Schema.Union(AuditResultSuccessSchema, AuditResultFailureSchema);

export const resultByIdEndpoint = HttpApiEndpoint.get('resultById', '/:id/result')
  .setPath(Schema.Struct({ id: AuditId }))
  .addSuccess(AuditResultSchema)
  .addError(HttpApiError.BadRequest)
  .addError(HttpApiError.NotFound)
  .addError(AuditNotFoundError);

export const reportByIdEndpoint = HttpApiEndpoint.get('reportById', '/:id/report')
  .setPath(Schema.Struct({ id: AuditId }))
  .addSuccess(HttpApiSchema.Text({ contentType: 'text/html' }))
  .addError(HttpApiError.BadRequest)
  .addError(HttpApiError.NotFound)
  .addError(AuditNotFoundError);
