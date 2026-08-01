import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from 'effect/unstable/httpapi';
import { Schema } from 'effect';

import { AuditKindSchema } from '@app-speed/audit/core/domain';

import { AuditErrorSchema, AuditId, AuditResultStatusSchema } from '../audit/Audit';

const RunnerId = Schema.NonEmptyString.pipe(Schema.brand('RunnerId'));
const RunnerHeartbeatStateSchema = Schema.Literals(['BUSY', 'IDLE']);
const RunnerShutdownReasonSchema = Schema.Literal('IDLE_TIMEOUT');

const RunnerClaimRequestSchema = Schema.Struct({
  runnerId: RunnerId,
});

const RunnerClaimResponseSchema = Schema.Union([
  Schema.Struct({ available: Schema.Literal(false) }),
  Schema.Struct({
    available: Schema.Literal(true),
    auditId: AuditId,
    kind: AuditKindSchema,
    definition: Schema.Unknown,
  }),
]);

const RunnerCompleteSuccessSchema = Schema.Struct({
  runnerId: RunnerId,
  auditId: AuditId,
  kind: AuditKindSchema,
  status: AuditResultStatusSchema.pick(['SUCCESS']),
  result: Schema.Unknown,
  durationMs: Schema.Number.check(Schema.isGreaterThanOrEqualTo(0)),
});

const RunnerCompleteFailureSchema = Schema.Struct({
  runnerId: RunnerId,
  auditId: AuditId,
  kind: AuditKindSchema,
  status: AuditResultStatusSchema.pick(['FAILURE']),
  error: AuditErrorSchema,
  durationMs: Schema.Number.check(Schema.isGreaterThanOrEqualTo(0)),
});

const RunnerCompleteRequestSchema = Schema.Union([RunnerCompleteSuccessSchema, RunnerCompleteFailureSchema]);

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
    HttpApiEndpoint.post('claim', '/claim', {
      payload: RunnerClaimRequestSchema,
      success: RunnerClaimResponseSchema,
      error: HttpApiError.BadRequestNoContent,
    }),
  )
  .add(
    HttpApiEndpoint.post('complete', '/complete', {
      payload: RunnerCompleteRequestSchema,
      success: Schema.Struct({ ok: Schema.Literal(true) }),
      error: HttpApiError.BadRequestNoContent,
    }),
  )
  .add(
    HttpApiEndpoint.post('heartbeat', '/heartbeat', {
      payload: RunnerHeartbeatRequestSchema,
      success: Schema.Struct({ ok: Schema.Literal(true) }),
      error: HttpApiError.BadRequestNoContent,
    }),
  )
  .add(
    HttpApiEndpoint.post('shutdown', '/shutdown', {
      payload: RunnerShutdownRequestSchema,
      success: RunnerShutdownResponseSchema,
      error: HttpApiError.BadRequestNoContent,
    }),
  )
  .prefix('/runner') {}
