import { Clock, Config, Context, Duration, Effect, Layer } from 'effect';

import { RunnerManager } from './RunnerManager.js';
import { RunnerLifecycle } from './RunnerLifecycle.js';
import { RunnerRegistry } from './RunnerRegistry.js';

const runnerIdleTimeoutMsConfig = Config.integer('RUNNER_IDLE_TIMEOUT_MS').pipe(Config.withDefault(60_000));
const runnerIdleReaperIntervalMsConfig = Config.integer('RUNNER_IDLE_REAPER_INTERVAL_MS').pipe(
  Config.withDefault(5_000),
);

export class RunnerIdleReaper extends Context.Tag('RunnerIdleReaper')<RunnerIdleReaper, Record<string, never>>() {}

export const RunnerIdleReaperLive = Layer.scoped(
  RunnerIdleReaper,
  Effect.gen(function* () {
    const runnerManager = yield* RunnerManager;
    const runnerLifecycle = yield* RunnerLifecycle;
    const runnerRegistry = yield* RunnerRegistry;
    const idleTimeoutMs = yield* runnerIdleTimeoutMsConfig;
    const reaperIntervalMs = yield* runnerIdleReaperIntervalMsConfig;

    const reapOnce = Effect.gen(function* () {
      const nowMs = yield* Clock.currentTimeMillis;
      const activeRunners = yield* runnerManager.listActiveRunners;
      const activeRunnerIds = activeRunners.map((runner) => String(runner.id));
      yield* runnerRegistry.pruneInactiveRunners(activeRunnerIds);
      const idleRunnerIds = yield* runnerRegistry.listIdleRunnerIds(activeRunnerIds, idleTimeoutMs);

      yield* Effect.annotateCurrentSpan({
        'runner.reaper.active_count': activeRunnerIds.length,
        'runner.reaper.idle_count': idleRunnerIds.length,
        'runner.reaper.idle_timeout_ms': idleTimeoutMs,
        'runner.reaper.timestamp': nowMs,
      });

      if (idleRunnerIds.length > 0) {
        yield* Effect.logInfo(`Requesting idle runner shutdown for ${idleRunnerIds.join(', ')}`);
        yield* runnerLifecycle.requestInactivationIfQueueEmpty('idle-reaper');
      }
    }).pipe(
      Effect.withSpan('runner.reaper.tick'),
      Effect.catchAllCause((cause) => Effect.logError(`Runner idle reaper failed: ${cause}`)),
    );

    yield* Effect.forkScoped(
      Effect.forever(reapOnce.pipe(Effect.zipRight(Effect.sleep(Duration.millis(reaperIntervalMs))))),
    );

    return {};
  }),
);
