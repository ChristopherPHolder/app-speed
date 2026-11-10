import { Schema } from 'effect';

export const ReplayStepDiagnosticSchema = Schema.Struct({
  stepIndex: Schema.Number,
  stepOrdinal: Schema.Number,
  stepType: Schema.String,
  stepName: Schema.optional(Schema.String),
  targetUrl: Schema.optional(Schema.String),
  selectors: Schema.optional(Schema.Array(Schema.Array(Schema.String))),
  timeoutMs: Schema.Number,
  status: Schema.Literals(['completed', 'failed', 'skipped']),
});
export const ReplayDiagnosticsSchema = Schema.Struct({
  stepIndex: Schema.Number,
  stepOrdinal: Schema.Number,
  lastSuccessfulStepIndex: Schema.NullOr(Schema.Number),
  steps: Schema.Array(ReplayStepDiagnosticSchema),
  evidence: Schema.String,
});
