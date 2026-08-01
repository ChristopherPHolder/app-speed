import { Effect, Layer } from 'effect';
import { ActiveRunnerList, RunnerManager } from './RunnerManager.js';

/** Runner manager for integration tests that intentionally drive API boundaries without executing queued work. */
export const ManualRunnerManagerLive = Layer.succeed(RunnerManager)({
  ensureRunnerActive: Effect.void,
  listActiveRunners: Effect.succeed<ActiveRunnerList>([]),
  terminateRunner: () => Effect.void,
});
