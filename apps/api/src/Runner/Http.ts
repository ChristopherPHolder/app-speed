import { HttpApiBuilder, HttpApiError } from '@effect/platform';
import { Effect, Match } from 'effect';
import { Api } from '../Api.js';
import { AuditRepo } from '@app-speed/server/db';
import { RunnerLifecycle } from './RunnerLifecycle.js';
import { RunnerRegistry } from './RunnerRegistry.js';

export const RunnerGroupLive = HttpApiBuilder.group(Api, 'runner', (handlers) =>
  Effect.gen(function* () {
    yield* Effect.logDebug('RunnerGroupLive');
    const repo = yield* AuditRepo;
    const runnerLifecycle = yield* RunnerLifecycle;
    const runnerRegistry = yield* RunnerRegistry;

    return handlers
      .handle(
        'claim',
        Effect.fn('api.runner.claim')((request) =>
          Effect.gen(function* () {
            yield* Effect.annotateCurrentSpan({ 'runner.id': request.payload.runnerId });
            const run = yield* repo.claimNextRun();
            const response = Match.value(run).pipe(
              Match.when(null, () => ({ available: false as const })),
              Match.orElse((nextRun) => ({
                available: true as const,
                auditId: nextRun.id,
                auditDetails: nextRun.data,
              })),
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
            const result = Match.value(request.payload).pipe(
              Match.when({ status: 'SUCCESS' }, (payload) => ({
                status: payload.status,
                data: payload.result,
                reportHtml: payload.reportHtml,
              })),
              Match.when({ status: 'FAILURE' }, (payload) => ({
                status: payload.status,
                data: null,
                error: payload.error,
              })),
              Match.exhaustive,
            );
            yield* Effect.annotateCurrentSpan({
              'runner.id': request.payload.runnerId,
              'audit.id': request.payload.auditId,
              'audit.status': request.payload.status,
              'audit.duration_ms': request.payload.durationMs,
            });

            yield* Effect.logInfo(
              `Runner ${request.payload.runnerId} completed ${request.payload.auditId} in ${request.payload.durationMs} with status ${request.payload.status}`,
            );

            yield* repo
              .completeRun(request.payload.auditId, result, request.payload.durationMs)
              .pipe(Effect.catchTag('QueryError', () => new HttpApiError.BadRequest()));
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
