import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from '@effect/platform';
import { Schema } from 'effect';
import { ReplayUserflowAuditSchema } from '@app-speed/audit/contracts';
import { AuditId } from '../Audit/Audit.js';

const RunnerId = Schema.NonEmptyString.pipe(Schema.brand('RunnerId'));
const RunnerHeartbeatStateSchema = Schema.Literal('BUSY', 'IDLE');
const RunnerShutdownReasonSchema = Schema.Literal('IDLE_TIMEOUT');

const AuditResultStatusSchema = Schema.Literal('SUCCESS', 'FAILURE');
const AuditErrorSchema = Schema.Struct({
  name: Schema.String,
  message: Schema.String,
  stack: Schema.String,
});

const RunnerClaimRequestSchema = Schema.Struct({
  runnerId: RunnerId,
});

const RunnerClaimResponseSchema = Schema.Union(
  Schema.Struct({ available: Schema.Literal(false) }),
  Schema.Struct({
    available: Schema.Literal(true),
    auditId: AuditId,
    auditDetails: ReplayUserflowAuditSchema,
  }),
);

const RunnerCompleteSuccessSchema = Schema.Struct({
  runnerId: RunnerId,
  auditId: AuditId,
  status: AuditResultStatusSchema.pipe(Schema.pickLiteral('SUCCESS')),
  result: Schema.Unknown,
  reportHtml: Schema.String,
  durationMs: Schema.NonNegative,
});

const RunnerCompleteFailureSchema = Schema.Struct({
  runnerId: RunnerId,
  auditId: AuditId,
  status: AuditResultStatusSchema.pipe(Schema.pickLiteral('FAILURE')),
  error: AuditErrorSchema,
  durationMs: Schema.NonNegative,
});

const RunnerCompleteRequestSchema = Schema.Union(RunnerCompleteSuccessSchema, RunnerCompleteFailureSchema);

const RunnerHeartbeatRequestSchema = Schema.Struct({
  runnerId: RunnerId,
  timestamp: Schema.optional(Schema.Number),
  state: Schema.optional(RunnerHeartbeatStateSchema),
  idleSince: Schema.optional(Schema.Number),
});

const RunnerShutdownRequestSchema = Schema.Struct({
  runnerId: RunnerId,
  reason: RunnerShutdownReasonSchema,
  timestamp: Schema.optional(Schema.Number),
});

const RunnerShutdownResponseSchema = Schema.Struct({
  ok: Schema.Literal(true),
  shouldTerminate: Schema.Boolean,
});

export class RunnerApiGroup extends HttpApiGroup.make('runner')
  .add(
    HttpApiEndpoint.post('claim', '/claim')
      .setPayload(RunnerClaimRequestSchema)
      .addSuccess(RunnerClaimResponseSchema)
      .addError(HttpApiError.BadRequest),
  )
  .add(
    HttpApiEndpoint.post('complete', '/complete')
      .setPayload(RunnerCompleteRequestSchema)
      .addSuccess(Schema.Struct({ ok: Schema.Literal(true) }))
      .addError(HttpApiError.BadRequest),
  )
  .add(
    HttpApiEndpoint.post('heartbeat', '/heartbeat')
      .setPayload(RunnerHeartbeatRequestSchema)
      .addSuccess(Schema.Struct({ ok: Schema.Literal(true) }))
      .addError(HttpApiError.BadRequest),
  )
  .add(
    HttpApiEndpoint.post('shutdown', '/shutdown')
      .setPayload(RunnerShutdownRequestSchema)
      .addSuccess(RunnerShutdownResponseSchema)
      .addError(HttpApiError.BadRequest),
  )
  .prefix('/runner') {}
