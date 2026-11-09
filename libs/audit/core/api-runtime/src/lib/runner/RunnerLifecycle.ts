import { AuditRepo } from '@app-speed/audit/core/persistence';
import { Clock, Config, Context, Duration, Effect, Layer, Ref, Semaphore } from 'effect';

import { RunnerManager } from './RunnerManager.js';
import { RunnerRegistry } from './RunnerRegistry.js';

export type RunnerDesiredState = 'ACTIVE' | 'INACTIVE';
export type RunnerInactivationSource = 'idle-reaper' | 'runner-shutdown';

const runnerReconcileIntervalMsConfig = Config.Int('RUNNER_RECONCILE_INTERVAL_MS').pipe(Config.withDefault(5_000));

export class RunnerLifecycle extends Context.Service<
  RunnerLifecycle,
  {
    requestActivation: Effect.Effect<void, never>;
    requestInactivationIfQueueEmpty: (
      source: RunnerInactivationSource,
    ) => Effect.Effect<{ shouldTerminate: boolean }, never>;
  }
>()('RunnerLifecycle') {}

type RunnerIntent = { desiredState: RunnerDesiredState; shutdownRequested: boolean };

const describeDesiredState = (state: RunnerDesiredState) => ({ 'runner.desired_state': state });

export const RunnerLifecycleLive = Layer.effect(RunnerLifecycle)(
  Effect.gen(function* () {
    const auditRepo = yield* AuditRepo;
    const runnerManager = yield* RunnerManager;
    const runnerRegistry = yield* RunnerRegistry;
    const reconcileIntervalMs = yield* runnerReconcileIntervalMsConfig;
    const reconcileSemaphore = yield* Semaphore.make(1);
    const hasQueuedWorkAtStartup = yield* auditRepo
      .hasScheduledRuns()
      .pipe(
        Effect.catchTag('QueryError', (error) =>
          Effect.logError(`Failed to determine initial runner desired state: ${String(error)}`).pipe(Effect.as(false)),
        ),
      );
    // Empty at API startup is not a shutdown request for a worker started by deployment.
    const intentRef = yield* Ref.make<RunnerIntent>({
      desiredState: hasQueuedWorkAtStartup ? 'ACTIVE' : 'INACTIVE',
      shutdownRequested: false,
    });

    const reconcileOnce = reconcileSemaphore.withPermits(1)(
      Effect.gen(function* () {
        const { desiredState } = yield* Ref.get(intentRef);
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

        // Consume the explicit intent once; future externally started workers retain their idle grace period.
        const intent = yield* Ref.getAndUpdate(intentRef, (state) => ({ ...state, shutdownRequested: false }));
        if (!intent.shutdownRequested || intent.desiredState !== 'INACTIVE' || activeRunnerIds.length === 0) return;

        for (const runnerId of activeRunnerIds) {
          yield* Effect.logInfo(`Runner lifecycle requesting termination for ${runnerId}`);
          yield* runnerManager.terminateRunner(runnerId);
        }
      }).pipe(
        Effect.withSpan('runner.lifecycle.reconcile'),
        Effect.catchCause((cause) => Effect.logError(`Runner lifecycle reconcile failed: ${cause}`)),
      ),
    );

    const triggerReconcile = Effect.forkDetach(reconcileOnce).pipe(Effect.asVoid);

    const setDesiredState = (state: RunnerDesiredState) =>
      Ref.set(intentRef, { desiredState: state, shutdownRequested: state === 'INACTIVE' }).pipe(
        Effect.tap(() => Effect.annotateCurrentSpan(describeDesiredState(state))),
        Effect.andThen(triggerReconcile),
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
            Effect.andThen(setDesiredState('ACTIVE')),
            Effect.as({ shouldTerminate: false }),
          ),
        ),
      );

    yield* Effect.forkScoped(
      Effect.forever(reconcileOnce.pipe(Effect.andThen(Effect.sleep(Duration.millis(reconcileIntervalMs))))),
    );

    return {
      requestActivation,
      requestInactivationIfQueueEmpty,
    };
  }),
);
