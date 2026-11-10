import { Schema } from 'effect';
import { ReplayDiagnosticsSchema } from '@app-speed/audit/core/domain';

/** Persisted with the failed run; optional fields keep historical failures readable. */
export const UserFlowFailureSchema = Schema.Struct({
  name: Schema.String,
  message: Schema.String,
  diagnostics: Schema.optional(ReplayDiagnosticsSchema),
  partialResult: Schema.optional(Schema.Unknown),
});
