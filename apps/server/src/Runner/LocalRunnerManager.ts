import { randomUUID } from 'node:crypto';
import { Command } from '@effect/platform';
import { Effect, Exit, Layer, Option, Scope, SynchronizedRef } from 'effect';
import type { CloseableScope } from 'effect/Scope';
import { NodeContext } from '@effect/platform-node';
import type { Process } from '@effect/platform/CommandExecutor';

import { RunnerManager, type ActiveRunnerList } from './RunnerManager.js';
import { RunnerRegistry } from './RunnerRegistry.js';

type RunnerHandle = {
  runnerId: string;
  process: Process;
  scope: CloseableScope;
};

type RunnerState = {
  handle: Option.Option<RunnerHandle>;
};

const closeScope = (scope: CloseableScope) => Scope.close(scope, Exit.void).pipe(Effect.catchAll(() => Effect.void));

const startRunner = (runnerId: string) =>
  Effect.gen(function* () {
    const scope = yield* Scope.make();
    const runnerProcess = yield* Command.start(
      Command.make('pnpm', 'exec', 'nx', 'execute', 'runner-app').pipe(
        Command.workingDirectory(process.cwd()),
        Command.stdout('inherit'),
        Command.stderr('inherit'),
        Command.env({ RUNNER_ID: runnerId }),
      ),
    ).pipe(
      Scope.extend(scope),
      Effect.catchAll((error) => closeScope(scope).pipe(Effect.zipRight(Effect.fail(error)))),
    );
    yield* Effect.annotateCurrentSpan({ 'runner.id': runnerId, 'runner.process_pid': runnerProcess.pid });
    return { runnerId, process: runnerProcess, scope } satisfies RunnerHandle;
  }).pipe(Effect.withSpan('runner.manager.startProcess'));

export const LocalRunnerManagerLive = Layer.scoped(
  RunnerManager,
  Effect.gen(function* () {
    const runnerRegistry = yield* RunnerRegistry;
    const stateRef = yield* SynchronizedRef.make<RunnerState>({
      handle: Option.none(),
    });

    const ensureRunnerActive = SynchronizedRef.modifyEffect(stateRef, (state) =>
      Effect.gen(function* () {
        if (Option.isSome(state.handle)) {
          yield* Effect.annotateCurrentSpan({ 'runner.id': state.handle.value.runnerId });
          const isRunning = yield* state.handle.value.process.isRunning.pipe(
            Effect.catchAll(() => Effect.succeed(false)),
          );
          yield* Effect.annotateCurrentSpan({ 'runner.is_running': isRunning });
          if (isRunning) {
            return [void 0, state] as const;
          }

          yield* closeScope(state.handle.value.scope);
          yield* runnerRegistry.markTerminated(state.handle.value.runnerId);
        }

        const runnerId = `local-${randomUUID()}`;
        const handle = yield* startRunner(runnerId).pipe(
          Effect.map(Option.some),
          Effect.catchAll((error) => Effect.logError(error).pipe(Effect.as(Option.none<RunnerHandle>()))),
        );

        if (Option.isNone(handle)) {
          yield* Effect.annotateCurrentSpan({ 'runner.started': false });
          return [void 0, { handle: Option.none() }] as const;
        }

        yield* Effect.annotateCurrentSpan({
          'runner.started': true,
          'runner.id': handle.value.runnerId,
        });
        return [
          void 0,
          {
            handle,
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

        const handle = state.handle.value;
        const isRunning = yield* handle.process.isRunning.pipe(Effect.catchAll(() => Effect.succeed(false)));

        if (!isRunning) {
          yield* closeScope(handle.scope);
          yield* runnerRegistry.markTerminated(handle.runnerId);
          yield* Effect.annotateCurrentSpan({ 'runner.list_count': 0, 'runner.is_running': false });
          return [emptyList, { handle: Option.none() }] as const;
        }

        const activeList = yield* runnerRegistry.listActiveRunners([handle.runnerId]);
        yield* Effect.annotateCurrentSpan({
          'runner.list_count': activeList.length,
          'runner.id': handle.runnerId,
          'runner.is_running': true,
        });
        return [activeList, state] as const;
      }),
    ).pipe(Effect.withSpan('runner.manager.listActive'));

    const terminateRunner = (runnerId: string) =>
      SynchronizedRef.modifyEffect(stateRef, (state) =>
        Effect.gen(function* () {
          if (Option.isNone(state.handle)) {
            yield* Effect.annotateCurrentSpan({ 'runner.terminate_found': false });
            return [void 0, state] as const;
          }

          const handle = state.handle.value;
          if (handle.runnerId !== runnerId) {
            yield* Effect.annotateCurrentSpan({
              'runner.terminate_found': false,
              'runner.id': handle.runnerId,
              'runner.requested_id': runnerId,
            });
            return [void 0, state] as const;
          }

          yield* closeScope(handle.scope);
          yield* runnerRegistry.markTerminated(handle.runnerId);
          yield* Effect.annotateCurrentSpan({
            'runner.terminate_found': true,
            'runner.id': runnerId,
          });

          return [void 0, { handle: Option.none() }] as const;
        }),
      ).pipe(Effect.withSpan('runner.manager.terminate'), Effect.provide(NodeContext.layer));

    return {
      ensureRunnerActive,
      listActiveRunners,
      terminateRunner,
    };
  }),
);
