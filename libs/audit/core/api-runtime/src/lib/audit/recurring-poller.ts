import { Duration, Effect, Layer } from 'effect';
import { AuditRepo, RecurringDispatch } from '@app-speed/audit/core/persistence';
import { RunnerLifecycle } from '../runner/RunnerLifecycle';

export const RecurringPollerLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const dispatcher = yield* RecurringDispatch;
    const lifecycle = yield* RunnerLifecycle;
    const repo = yield* AuditRepo;
    const tick = Effect.gen(function* () {
      yield* dispatcher.tick.pipe(Effect.catchCause((cause) => Effect.logError('Recurring dispatch failed', cause)));
      // Also recover activation after a commit followed by process failure or an activation failure.
      if (yield* repo.hasScheduledRuns()) yield* lifecycle.requestActivation;
    }).pipe(Effect.catchCause((cause) => Effect.logError('Recurring dispatch tick failed', cause)));
    yield* Effect.forkScoped(Effect.forever(tick.pipe(Effect.andThen(Effect.sleep(Duration.seconds(1))))));
  }),
);
