import { HttpApiBuilder, HttpApiError } from '@effect/platform';
import { Effect, Match } from 'effect';
import { CoreApi } from '@app-speed/audit/core/api-contract';
import { AuditRepo } from '@app-speed/audit/core/persistence';
import { RunnerLifecycle } from './RunnerLifecycle.js';
import { RunnerRegistry } from './RunnerRegistry.js';
import { InstalledAuditFeatures } from './InstalledAuditFeatures.js';

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
              Match.when(null, () => Effect.succeed({ available: false as const })),
              Match.orElse((nextRun) =>
                installedFeatures.getDefinition(nextRun.kind, nextRun.templateId).pipe(
                  Effect.map((definition) => ({
                    available: true as const,
                    auditId: nextRun.id,
                    kind: nextRun.kind,
                    definition,
                  })),
                ),
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
            Effect.catchTag('ParseError', () => new HttpApiError.BadRequest()),
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

            return { ok: true as const };
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
              Effect.as({ ok: true as const }),
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
            return { ok: true as const, shouldTerminate: decision.shouldTerminate };
          }).pipe(Effect.withSpan('api.runner.shutdown')),
        ),
      );
  }),
);
