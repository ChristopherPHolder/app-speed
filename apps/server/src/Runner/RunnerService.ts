import { Cause, Config, Context, Effect, Layer, Ref } from 'effect';
import { processQueue } from '@app-speed/runner-user-flow-replay';
import { AuditRepo } from '@app-speed/server/db';

type RunnerMode = 'local' | 'off';

export class RunnerService extends Context.Tag('RunnerService')<
  RunnerService,
  {
    kick: Effect.Effect<void, never>;
  }
>() {}

const parseRunnerMode = (mode: string): RunnerMode => {
  const normalized = mode.trim().toLowerCase();
  if (normalized === 'off' || normalized === 'disabled' || normalized === 'remote') return 'off';
  return 'local';
};

export const RunnerServiceLive = Layer.effect(
  RunnerService,
  Effect.gen(function* () {
    const modeValue = yield* Config.string('RUNNER_MODE').pipe(Config.withDefault('local'));
    const mode = parseRunnerMode(modeValue);
    const running = yield* Ref.make(false);
    const repo = yield* AuditRepo;

    const kick = Effect.gen(function* () {
      if (mode !== 'local') return;

      const shouldStart = yield* Ref.modify(running, (isRunning) => [!isRunning, true]);
      if (!shouldStart) return;

      yield* Effect.log('Starting local runner');

      yield* Effect.forkDaemon(
        processQueue.pipe(
          Effect.provideService(AuditRepo, repo),
          Effect.tapErrorCause((cause) => Effect.logError(Cause.pretty(cause))),
          Effect.ensuring(Ref.set(running, false)),
        ),
      );
    }).pipe(
      Effect.catchAllCause((cause) =>
        Effect.logError(`Runner kick failed: ${Cause.pretty(cause)}`),
      ),
      Effect.asVoid,
    );

    return { kick };
  }),
);
