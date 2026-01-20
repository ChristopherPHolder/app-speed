import { HttpApiSchema } from '@effect/platform';
import { Schema } from 'effect';

export const AuditId = Schema.String.pipe(Schema.brand('AuditId'));

export class AuditNotFoundError extends Schema.TaggedError<AuditNotFoundError>()(
  'AuditNotFoundError',
  { id: AuditId },
  HttpApiSchema.annotations({ status: 404 }),
) {}
