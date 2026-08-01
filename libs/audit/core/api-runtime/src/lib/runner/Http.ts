import { HttpApiBuilder, HttpApiError } from 'effect/unstable/httpapi';
import { Effect, Match } from 'effect';
import { CoreApi } from '@app-speed/audit/core/api-contract';
import { AuditRepo } from '@app-speed/audit/core/persistence';
import { RunnerLifecycle } from './RunnerLifecycle.js';
import { RunnerRegistry } from './RunnerRegistry.js';
import { InstalledAuditFeatures } from './InstalledAuditFeatures.js';

const unavailableClaimResponse: { readonly available: false } = { available: false };
const availableClaimResponse = <AuditId, Kind, Definition>(
  auditId: AuditId,
  kind: Kind,
  definition: Definition,
): {
  readonly available: true;
  readonly auditId: AuditId;
  readonly kind: Kind;
  readonly definition: Definition;
} => ({ available: true, auditId, kind, definition });
const okResponse: { readonly ok: true } = { ok: true };
const shutdownResponse = (shouldTerminate: boolean): { readonly ok: true; readonly shouldTerminate: boolean } => ({
  ok: true,
  shouldTerminate,
});

export const RunnerGroupLive = HttpApiBuilder.group(CoreApi, 'runner', (handlers) =>
  Effect.gen(function* () {
    yield* Effect.logDebug('RunnerGroupLive');
    const repo = yield* AuditRepo;
    const runnerLifecycle = yield* RunnerLifecycle;
    const runnerRegistry = yield* RunnerRegistry;
    const installedFeatures = yield* InstalledAuditFeatures;

    return handlers
      .handle(
        'claim',
        Effect.fn('api.runner.claim')((request) =>
          Effect.gen(function* () {
            yield* Effect.annotateCurrentSpan({ 'runner.id': request.payload.runnerId });
            const run = yield* repo.claimNextRun();
            const response = yield* Match.value(run).pipe(
              Match.when(null, () => Effect.succeed(unavailableClaimResponse)),
              Match.orElse((nextRun) =>
                installedFeatures
                  .getDefinition(nextRun.kind, nextRun.templateId)
                  .pipe(Effect.map((definition) => availableClaimResponse(nextRun.id, nextRun.kind, definition))),
              ),
            );

            yield* runnerRegistry.recordClaimResult(request.payload.runnerId, response.available);
            yield* Effect.annotateCurrentSpan({
              'runner.claim_available': response.available,
              'audit.id': response.available ? response.auditId : null,
            });
            return response;
          }).pipe(
            Effect.withSpan('api.runner.claim'),
            Effect.catchTag('QueryError', () => new HttpApiError.BadRequest()),
            Effect.catchTag('SchemaError', () => new HttpApiError.BadRequest()),
          ),
        ),
      )
      .handle(
        'complete',
        Effect.fn('api.runner.complete')((request) =>
          Effect.gen(function* () {
            yield* Effect.annotateCurrentSpan({
              'runner.id': request.payload.runnerId,
              'audit.id': request.payload.auditId,
              'audit.status': request.payload.status,
              'audit.duration_ms': request.payload.durationMs,
            });

            yield* Effect.logInfo(
              `Runner ${request.payload.runnerId} completed ${request.payload.auditId} in ${request.payload.durationMs} with status ${request.payload.status}`,
            );

            yield* Match.value(request.payload).pipe(
              Match.when({ status: 'SUCCESS' }, (payload) =>
                installedFeatures.completeSuccess(payload.kind, payload.auditId, payload.result, payload.durationMs),
              ),
              Match.when({ status: 'FAILURE' }, (payload) =>
                repo.completeFailure(payload.auditId, payload.error, payload.durationMs),
              ),
              Match.exhaustive,
              Effect.catchTag('QueryError', () => new HttpApiError.BadRequest()),
            );
            yield* runnerRegistry.recordCompletion(request.payload.runnerId);

            return okResponse;
          }).pipe(Effect.withSpan('api.runner.complete')),
        ),
      )
      .handle(
        'heartbeat',
        Effect.fn('api.runner.heartbeat')((request) =>
          runnerRegistry
            .recordHeartbeat(request.payload.runnerId, {
              timestamp: request.payload.timestamp,
              state: request.payload.state,
              idleSince: request.payload.idleSince,
            })
            .pipe(
              Effect.tap(() =>
                Effect.annotateCurrentSpan({
                  'runner.id': request.payload.runnerId,
                  'runner.heartbeat_timestamp': request.payload.timestamp ?? null,
                  'runner.heartbeat_state': request.payload.state ?? null,
                  'runner.idle_since': request.payload.idleSince ?? null,
                }),
              ),
              Effect.as(okResponse),
              Effect.withSpan('api.runner.heartbeat'),
            ),
        ),
      )
      .handle(
        'shutdown',
        Effect.fn('api.runner.shutdown')((request) =>
          Effect.gen(function* () {
            yield* Effect.annotateCurrentSpan({
              'runner.id': request.payload.runnerId,
              'runner.shutdown_reason': request.payload.reason,
              'runner.shutdown_timestamp': request.payload.timestamp ?? null,
            });
            yield* Effect.logInfo(
              `Runner ${request.payload.runnerId} requested shutdown with reason ${request.payload.reason}`,
            );
            const decision = yield* runnerLifecycle.requestInactivationIfQueueEmpty('runner-shutdown');
            return shutdownResponse(decision.shouldTerminate);
          }).pipe(Effect.withSpan('api.runner.shutdown')),
        ),
      );
  }),
);
