import { HttpApiSchema } from '@effect/platform';
import { Schema } from 'effect';

import { AuditRunIdSchema } from '@app-speed/server/db';

export const AuditId = AuditRunIdSchema;

export type AuditIdType = typeof AuditId.Type;

export class AuditNotFoundError extends Schema.TaggedError<AuditNotFoundError>()(
  'AuditNotFoundError',
  { id: AuditId },
  HttpApiSchema.annotations({ status: 404 }),
) {}
