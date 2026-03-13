import { AuditRepo } from '@app-speed/server/db';
import { Clock, Config, Context, Duration, Effect, Layer, Ref } from 'effect';

import { RunnerManager } from './RunnerManager.js';
import { RunnerRegistry } from './RunnerRegistry.js';

export type RunnerDesiredState = 'ACTIVE' | 'INACTIVE';
export type RunnerInactivationSource = 'idle-reaper' | 'runner-shutdown';

const runnerReconcileIntervalMsConfig = Config.integer('RUNNER_RECONCILE_INTERVAL_MS').pipe(Config.withDefault(5_000));

export class RunnerLifecycle extends Context.Tag('RunnerLifecycle')<
  RunnerLifecycle,
  {
    requestActivation: Effect.Effect<void, never>;
    requestInactivationIfQueueEmpty: (
      source: RunnerInactivationSource,
    ) => Effect.Effect<{ shouldTerminate: boolean }, never>;
  }
>() {}

const describeDesiredState = (state: RunnerDesiredState) => ({ 'runner.desired_state': state });

export const RunnerLifecycleLive = Layer.scoped(
  RunnerLifecycle,
  Effect.gen(function* () {
    const auditRepo = yield* AuditRepo;
    const runnerManager = yield* RunnerManager;
    const runnerRegistry = yield* RunnerRegistry;
    const reconcileIntervalMs = yield* runnerReconcileIntervalMsConfig;
    const reconcileSemaphore = yield* Effect.makeSemaphore(1);
    const hasQueuedWorkAtStartup = yield* auditRepo
      .hasScheduledRuns()
      .pipe(
        Effect.catchTag('QueryError', (error) =>
          Effect.logError(`Failed to determine initial runner desired state: ${String(error)}`).pipe(Effect.as(false)),
        ),
      );
    const desiredStateRef = yield* Ref.make<RunnerDesiredState>(hasQueuedWorkAtStartup ? 'ACTIVE' : 'INACTIVE');

    const reconcileOnce = reconcileSemaphore.withPermits(1)(
      Effect.gen(function* () {
        const desiredState = yield* Ref.get(desiredStateRef);
        const activeRunners = yield* runnerManager.listActiveRunners;
        const activeRunnerIds = activeRunners.map((runner) => String(runner.id));
        const nowMs = yield* Clock.currentTimeMillis;

        yield* runnerRegistry.pruneInactiveRunners(activeRunnerIds);
        yield* Effect.annotateCurrentSpan({
          ...describeDesiredState(desiredState),
          'runner.reconcile.active_count': activeRunnerIds.length,
          'runner.reconcile.timestamp': nowMs,
        });

        if (desiredState === 'ACTIVE') {
          if (activeRunnerIds.length === 0) {
            yield* Effect.logInfo('Runner lifecycle requesting activation');
            yield* runnerManager.ensureRunnerActive;
          }
          return;
        }

        if (activeRunnerIds.length === 0) {
          return;
        }

        for (const runnerId of activeRunnerIds) {
          yield* Effect.logInfo(`Runner lifecycle requesting termination for ${runnerId}`);
          yield* runnerManager.terminateRunner(runnerId);
        }
      }).pipe(
        Effect.withSpan('runner.lifecycle.reconcile'),
        Effect.catchAllCause((cause) => Effect.logError(`Runner lifecycle reconcile failed: ${cause}`)),
      ),
    );

    const triggerReconcile = Effect.forkDaemon(reconcileOnce).pipe(Effect.asVoid);

    const setDesiredState = (state: RunnerDesiredState) =>
      Ref.set(desiredStateRef, state).pipe(
        Effect.tap(() => Effect.annotateCurrentSpan(describeDesiredState(state))),
        Effect.zipRight(triggerReconcile),
      );

    const requestActivation = setDesiredState('ACTIVE').pipe(Effect.withSpan('runner.lifecycle.requestActivation'));

    const requestInactivationIfQueueEmpty = (source: RunnerInactivationSource) =>
      auditRepo.hasScheduledRuns().pipe(
        Effect.flatMap((hasQueuedWork) =>
          setDesiredState(hasQueuedWork ? 'ACTIVE' : 'INACTIVE').pipe(Effect.as({ shouldTerminate: !hasQueuedWork })),
        ),
        Effect.tap((decision) =>
          Effect.annotateCurrentSpan({
            'runner.inactivation_source': source,
            'runner.should_terminate': decision.shouldTerminate,
          }),
        ),
        Effect.withSpan('runner.lifecycle.requestInactivation'),
        Effect.catchTag('QueryError', (error) =>
          Effect.logError(`Failed to evaluate runner inactivation (${source}): ${String(error)}`).pipe(
            Effect.zipRight(setDesiredState('ACTIVE')),
            Effect.as({ shouldTerminate: false }),
          ),
        ),
      );

    yield* Effect.forkScoped(
      Effect.forever(reconcileOnce.pipe(Effect.zipRight(Effect.sleep(Duration.millis(reconcileIntervalMs))))),
    );

    return {
      requestActivation,
      requestInactivationIfQueueEmpty,
    };
  }),
);
