import { AuditRepo } from '@app-speed/server/db';
import { Deferred, Effect, Layer, Ref } from 'effect';
import { describe, expect, it } from 'vitest';

import { RunnerLifecycle, RunnerLifecycleLive } from './RunnerLifecycle.js';
import { RunnerManager } from './RunnerManager.js';
import { RunnerRegistry } from './RunnerRegistry.js';

const unusedEffect = Effect.dieMessage('unused test stub');

const makeAuditRepoStub = (hasScheduledRuns: () => boolean) => ({
  createTemplate: () => unusedEffect,
  getTemplateById: () => unusedEffect,
  createRun: () => unusedEffect,
  claimNextRun: () => unusedEffect,
  hasScheduledRuns: () => Effect.succeed(hasScheduledRuns()),
  markRunInProgress: () => unusedEffect,
  getQueuePosition: () => unusedEffect,
  getRunSummaryById: () => unusedEffect,
  listRunsPage: () => unusedEffect,
  completeRun: () => unusedEffect,
  getRunById: () => unusedEffect,
  getResultByRunId: () => unusedEffect,
});

const runnerRegistryStub = {
  recordClaimResult: () => Effect.void,
  recordCompletion: () => Effect.void,
  recordHeartbeat: () => Effect.void,
  listActiveRunners: () => Effect.succeed([]),
  listIdleRunnerIds: () => Effect.succeed([]),
  markTerminated: () => Effect.void,
  pruneInactiveRunners: () => Effect.void,
};

describe('RunnerLifecycle', () => {
  it('restarts after activation is requested while shutdown is already in progress', async () => {
    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          let hasScheduledRuns = false;
          let runnerActive = true;

          const stopStarted = yield* Deferred.make<void>();
          const allowStopToFinish = yield* Deferred.make<void>();
          const runnerStarted = yield* Deferred.make<void>();
          const startCountRef = yield* Ref.make(0);
          const stopCountRef = yield* Ref.make(0);

          const runnerManagerStub = {
            ensureRunnerActive: Effect.gen(function* () {
              runnerActive = true;
              yield* Ref.update(startCountRef, (count) => count + 1);
              yield* Deferred.succeed(runnerStarted, void 0).pipe(Effect.ignore);
            }),
            listActiveRunners: Effect.sync(() =>
              runnerActive ? [{ id: 'runner-1' as const, lastHeartbeatAt: new Date() }] : [],
            ),
            terminateRunner: () =>
              Effect.gen(function* () {
                yield* Ref.update(stopCountRef, (count) => count + 1);
                yield* Deferred.succeed(stopStarted, void 0).pipe(Effect.ignore);
                yield* Deferred.await(allowStopToFinish);
                runnerActive = false;
              }),
          };

          const testLayer = Layer.provideMerge(
            RunnerLifecycleLive,
            Layer.mergeAll(
              Layer.succeed(
                AuditRepo,
                makeAuditRepoStub(() => hasScheduledRuns),
              ),
              Layer.succeed(RunnerManager, runnerManagerStub),
              Layer.succeed(RunnerRegistry, runnerRegistryStub),
            ),
          );

          yield* Effect.gen(function* () {
            const lifecycle = yield* RunnerLifecycle;

            const shutdownDecision = yield* lifecycle.requestInactivationIfQueueEmpty('runner-shutdown');
            expect(shutdownDecision.shouldTerminate).toBe(true);

            yield* Deferred.await(stopStarted);

            hasScheduledRuns = true;
            yield* lifecycle.requestActivation;

            yield* Deferred.succeed(allowStopToFinish, void 0);
            yield* Deferred.await(runnerStarted);

            const stopCount = yield* Ref.get(stopCountRef);
            const startCount = yield* Ref.get(startCountRef);

            expect(stopCount).toBe(1);
            expect(startCount).toBe(1);
          }).pipe(Effect.provide(testLayer));
        }),
      ),
    );
  });

  it('rejects shutdown when queued work exists and keeps activation requested', async () => {
    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          let hasScheduledRuns = true;
          let runnerActive = false;

          const runnerStarted = yield* Deferred.make<void>();
          const startCountRef = yield* Ref.make(0);

          const runnerManagerStub = {
            ensureRunnerActive: Effect.gen(function* () {
              runnerActive = true;
              yield* Ref.update(startCountRef, (count) => count + 1);
              yield* Deferred.succeed(runnerStarted, void 0).pipe(Effect.ignore);
            }),
            listActiveRunners: Effect.sync(() =>
              runnerActive ? [{ id: 'runner-1' as const, lastHeartbeatAt: new Date() }] : [],
            ),
            terminateRunner: () => Effect.dieMessage('terminateRunner should not be called'),
          };

          const testLayer = Layer.provideMerge(
            RunnerLifecycleLive,
            Layer.mergeAll(
              Layer.succeed(
                AuditRepo,
                makeAuditRepoStub(() => hasScheduledRuns),
              ),
              Layer.succeed(RunnerManager, runnerManagerStub),
              Layer.succeed(RunnerRegistry, runnerRegistryStub),
            ),
          );

          yield* Effect.gen(function* () {
            const lifecycle = yield* RunnerLifecycle;

            const shutdownDecision = yield* lifecycle.requestInactivationIfQueueEmpty('runner-shutdown');
            expect(shutdownDecision.shouldTerminate).toBe(false);

            yield* Deferred.await(runnerStarted);

            const startCount = yield* Ref.get(startCountRef);
            expect(startCount).toBe(1);
          }).pipe(Effect.provide(testLayer));
        }),
      ),
    );
  });
});
