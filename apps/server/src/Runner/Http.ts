import { HttpApiBuilder, HttpApiError } from '@effect/platform';
import { Effect, Match } from 'effect';
import { Api } from '../Api.js';
import { AuditRepo } from '@app-speed/server/db';

export const RunnerGroupLive = HttpApiBuilder.group(Api, 'runner', (handlers) =>
  Effect.gen(function* () {
    yield* Effect.logDebug('RunnerGroupLive');
    const repo = yield* AuditRepo;

    return handlers
      .handle(
        'claim',
        Effect.fn('api.runner.claim')((request) =>
          repo.claimNextRun().pipe(
            Effect.tap(() => Effect.annotateCurrentSpan({ 'runner.id': request.payload.runnerId })),
            Effect.map((run) =>
              Match.value(run).pipe(
                Match.when(null, () => ({ available: false as const })),
                Match.orElse((run) => ({ available: true as const, auditId: run.id, auditDetails: run.data })),
              ),
            ),
            Effect.tap((response) =>
              Effect.annotateCurrentSpan({
                'runner.claim_available': response.available,
                'audit.id': response.available ? response.auditId : null,
              }),
            ),
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
              Match.when({ status: 'SUCCESS' }, (payload) => ({ status: payload.status, data: payload.result })),
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

            return { ok: true as const };
          }).pipe(Effect.withSpan('api.runner.complete')),
        ),
      )
      .handle(
        'heartbeat',
        Effect.fn('api.runner.heartbeat')((request) =>
          Effect.succeed({ ok: true as const }).pipe(
            Effect.tap(() =>
              Effect.annotateCurrentSpan({
                'runner.id': request.payload.runnerId,
                'runner.heartbeat_timestamp': request.payload.timestamp ?? null,
              }),
            ),
            Effect.withSpan('api.runner.heartbeat'),
          ),
        ),
      );
  }),
);
