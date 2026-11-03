import { expect, it } from '@effect/vitest';
import { Deferred, Effect, Layer } from 'effect';
import { AuditRepo, QueryError, RecurringDispatch } from '@app-speed/audit/core/persistence';
import { RunnerLifecycle } from '../runner/RunnerLifecycle';
import { RecurringPollerLive } from './recurring-poller';

it.effect('activates durable queued work even if a later space fails identity verification during dispatch', () =>
  Effect.gen(function* () {
    const activated = yield* Deferred.make<string>();
    const services = Layer.mergeAll(
      Layer.succeed(RecurringDispatch)({
        tick: Effect.fail(new QueryError({ message: 'Identity provider unavailable' })),
      }),
      Layer.succeed(AuditRepo)({
        claimNextRun: () => Effect.succeed(null),
        hasScheduledRuns: () => Effect.succeed(true),
        getQueuePosition: () => Effect.succeed(0),
        getRunById: () => Effect.succeed(null),
        getResultByRunId: () => Effect.succeed(null),
        completeFailure: () => Effect.void,
      }),
      Layer.succeed(RunnerLifecycle)({
        requestActivation: Deferred.succeed(activated, 'activated').pipe(Effect.asVoid),
        requestInactivationIfQueueEmpty: () => Effect.succeed({ shouldTerminate: false }),
      }),
    );
    yield* Layer.build(RecurringPollerLive.pipe(Layer.provide(services)));
    expect(yield* Deferred.await(activated)).toBe('activated');
  }),
);
