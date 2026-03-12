import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

import { RunnerRegistry, RunnerRegistryLive } from './RunnerRegistry.js';

describe('RunnerRegistry', () => {
  it('marks a runner idle after an empty claim and clears idle state after completion', async () => {
    const now = Date.now();

    await Effect.runPromise(
      Effect.gen(function* () {
        const registry = yield* RunnerRegistry;

        yield* registry.recordClaimResult('runner-1', false, now - 61_000);
        const idleBeforeCompletion = yield* registry.listIdleRunnerIds(['runner-1'], 60_000);
        expect(idleBeforeCompletion).toEqual(['runner-1']);

        yield* registry.recordCompletion('runner-1', now);
        const idleAfterCompletion = yield* registry.listIdleRunnerIds(['runner-1'], 60_000);
        expect(idleAfterCompletion).toEqual([]);
      }).pipe(Effect.provide(RunnerRegistryLive)),
    );
  });

  it('reconstructs idle state from heartbeats and prunes inactive runners', async () => {
    const idleSince = Date.now() - 70_000;
    const heartbeatAt = idleSince + 65_000;

    await Effect.runPromise(
      Effect.gen(function* () {
        const registry = yield* RunnerRegistry;

        yield* registry.recordHeartbeat('runner-1', {
          timestamp: heartbeatAt,
          state: 'IDLE',
          idleSince,
        });

        const activeRunners = yield* registry.listActiveRunners(['runner-1']);
        expect(activeRunners).toHaveLength(1);
        expect(activeRunners[0].id).toBe('runner-1');
        expect(activeRunners[0].lastHeartbeatAt.getTime()).toBe(heartbeatAt);

        const idleRunnerIds = yield* registry.listIdleRunnerIds(['runner-1'], 60_000);
        expect(idleRunnerIds).toEqual(['runner-1']);

        yield* registry.pruneInactiveRunners([]);
        const idleAfterPrune = yield* registry.listIdleRunnerIds(['runner-1'], 60_000);
        expect(idleAfterPrune).toEqual([]);
      }).pipe(Effect.provide(RunnerRegistryLive)),
    );
  });
});
