import { Command } from '@effect/platform';
import { Effect, Exit, Layer, Option, Schema, Scope, SynchronizedRef } from 'effect';
import type { CloseableScope } from 'effect/Scope';
import { NodeContext } from '@effect/platform-node';
import type { Process } from '@effect/platform/CommandExecutor';

import { RunnerIdSchema, RunnerManager, type ActiveRunnerList } from './RunnerManager.js';

type RunnerHandle = {
  process: Process;
  scope: CloseableScope;
};

type RunnerState = {
  handle: Option.Option<RunnerHandle>;
  lastHeartbeatAt: Date | null;
};

const runnerCommand = Command.make('pnpm', 'exec', 'nx', 'execute', 'runner-app').pipe(
  Command.workingDirectory(process.cwd()),
  Command.stdout('inherit'),
  Command.stderr('inherit'),
);

const runnerIdFor = (process: Process) => `local-${process.pid}`;

const closeScope = (scope: CloseableScope) => Scope.close(scope, Exit.void).pipe(Effect.catchAll(() => Effect.void));

const toRunnerId = (value: string) => Schema.decodeSync(RunnerIdSchema)(value);

const startRunner = Effect.gen(function* () {
  const scope = yield* Scope.make();
  const process = yield* Command.start(runnerCommand).pipe(
    Scope.extend(scope),
    Effect.catchAll((error) => closeScope(scope).pipe(Effect.zipRight(Effect.fail(error)))),
  );
  yield* Effect.annotateCurrentSpan({ 'runner.id': runnerIdFor(process) });
  return { process, scope } satisfies RunnerHandle;
}).pipe(Effect.withSpan('runner.manager.startProcess'));

export const LocalRunnerManagerLive = Layer.scoped(
  RunnerManager,
  Effect.gen(function* () {
    const stateRef = yield* SynchronizedRef.make<RunnerState>({
      handle: Option.none(),
      lastHeartbeatAt: null,
    });

    const ensureRunnerActive = SynchronizedRef.modifyEffect(stateRef, (state) =>
      Effect.gen(function* () {
        if (Option.isSome(state.handle)) {
          yield* Effect.annotateCurrentSpan({ 'runner.id': runnerIdFor(state.handle.value.process) });
          const isRunning = yield* state.handle.value.process.isRunning.pipe(
            Effect.catchAll(() => Effect.succeed(false)),
          );
          yield* Effect.annotateCurrentSpan({ 'runner.is_running': isRunning });
          if (isRunning) {
            return [void 0, { ...state, lastHeartbeatAt: new Date() }] as const;
          }

          yield* closeScope(state.handle.value.scope);
        }

        const handle = yield* startRunner.pipe(
          Effect.map(Option.some),
          Effect.catchAll((error) => Effect.logError(error).pipe(Effect.as(Option.none<RunnerHandle>()))),
        );

        if (Option.isNone(handle)) {
          yield* Effect.annotateCurrentSpan({ 'runner.started': false });
          return [void 0, { handle: Option.none(), lastHeartbeatAt: null }] as const;
        }

        yield* Effect.annotateCurrentSpan({
          'runner.started': true,
          'runner.id': runnerIdFor(handle.value.process),
        });
        return [
          void 0,
          {
            handle,
            lastHeartbeatAt: new Date(),
          },
        ] as const;
      }),
    ).pipe(Effect.withSpan('runner.manager.ensureActive'), Effect.provide(NodeContext.layer));

    const listActiveRunners = SynchronizedRef.modifyEffect(stateRef, (state) =>
      Effect.gen(function* () {
        const emptyList: ActiveRunnerList = [];
        if (Option.isNone(state.handle)) {
          yield* Effect.annotateCurrentSpan({ 'runner.list_count': 0 });
          return [emptyList, state] as const;
        }

        const processHandle = state.handle.value.process;
        const isRunning = yield* processHandle.isRunning.pipe(Effect.catchAll(() => Effect.succeed(false)));

        if (!isRunning) {
          yield* closeScope(state.handle.value.scope);
          yield* Effect.annotateCurrentSpan({ 'runner.list_count': 0, 'runner.is_running': false });
          return [emptyList, { handle: Option.none(), lastHeartbeatAt: null }] as const;
        }

        const lastHeartbeatAt = state.lastHeartbeatAt ?? new Date();
        const activeList: ActiveRunnerList = [{ id: toRunnerId(runnerIdFor(processHandle)), lastHeartbeatAt }];
        yield* Effect.annotateCurrentSpan({
          'runner.list_count': activeList.length,
          'runner.id': runnerIdFor(processHandle),
          'runner.is_running': true,
        });
        return [activeList, { handle: state.handle, lastHeartbeatAt }] as const;
      }),
    ).pipe(Effect.withSpan('runner.manager.listActive'));

    const terminateRunner = (runnerId: string) =>
      SynchronizedRef.modifyEffect(stateRef, (state) =>
        Effect.gen(function* () {
          if (Option.isNone(state.handle)) {
            yield* Effect.annotateCurrentSpan({ 'runner.terminate_found': false });
            return [void 0, state] as const;
          }

          const processHandle = state.handle.value.process;
          if (runnerIdFor(processHandle) !== runnerId) {
            yield* Effect.annotateCurrentSpan({
              'runner.terminate_found': false,
              'runner.id': runnerIdFor(processHandle),
              'runner.requested_id': runnerId,
            });
            return [void 0, state] as const;
          }

          yield* closeScope(state.handle.value.scope);
          yield* Effect.annotateCurrentSpan({
            'runner.terminate_found': true,
            'runner.id': runnerId,
          });

          return [void 0, { handle: Option.none(), lastHeartbeatAt: null }] as const;
        }),
      ).pipe(Effect.withSpan('runner.manager.terminate'), Effect.provide(NodeContext.layer));

    return {
      ensureRunnerActive,
      listActiveRunners,
      terminateRunner,
    };
  }),
);
