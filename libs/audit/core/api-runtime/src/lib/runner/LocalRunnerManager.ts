import { randomUUID } from 'node:crypto';
import { appendFile } from 'node:fs/promises';
import { Config, Effect, Exit, Layer, Option, Scope, Stream, SynchronizedRef } from 'effect';
import { ChildProcess, ChildProcessSpawner } from 'effect/unstable/process';
import { NodeServices } from '@effect/platform-node';

import { RunnerManager, type ActiveRunnerList } from './RunnerManager.js';
import { RunnerRegistry } from './RunnerRegistry.js';

type RunnerHandle = {
  runnerId: string;
  process: ChildProcessSpawner.ChildProcessHandle;
  scope: Scope.Closeable;
};

type RunnerState = {
  handle: Option.Option<RunnerHandle>;
};

const stateResult = <A>(value: A, state: RunnerState): readonly [A, RunnerState] => [value, state];

const closeScope = (scope: Scope.Closeable) => Scope.close(scope, Exit.void);

const startRunner = Effect.fn('runner.manager.startProcess')(function* (runnerId: string) {
  const scope = yield* Scope.make();
  const runnerLogFile = yield* Config.string('RUNNER_LOG_FILE').pipe(Config.option);
  const runnerProcess = yield* ChildProcess.make('pnpm', ['exec', 'nx', 'execute', 'runner'], {
    cwd: process.cwd(),
    stdout: Option.isSome(runnerLogFile) ? 'pipe' : 'inherit',
    stderr: Option.isSome(runnerLogFile) ? 'pipe' : 'inherit',
    env: { RUNNER_ID: runnerId },
    extendEnv: true,
    detached: false,
  }).pipe(
    Scope.provide(scope),
    Effect.catch((error) => closeScope(scope).pipe(Effect.andThen(Effect.fail(error)))),
  );
  yield* Option.match(runnerLogFile, {
    onNone: () => Effect.void,
    onSome: (logFile) =>
      runnerProcess.all.pipe(
        Stream.runForEach((chunk) => Effect.promise(() => appendFile(logFile, chunk))),
        Effect.forkIn(scope),
        Effect.asVoid,
      ),
  });
  yield* Effect.annotateCurrentSpan({ 'runner.id': runnerId, 'runner.process_pid': runnerProcess.pid });
  return { runnerId, process: runnerProcess, scope } satisfies RunnerHandle;
});

export const LocalRunnerManagerLive = Layer.effect(RunnerManager)(
  Effect.gen(function* () {
    const runnerRegistry = yield* RunnerRegistry;
    const stateRef = yield* SynchronizedRef.make<RunnerState>({
      handle: Option.none(),
    });

    const ensureRunnerActive = SynchronizedRef.modifyEffect(stateRef, (state) =>
      Effect.gen(function* () {
        if (Option.isSome(state.handle)) {
          yield* Effect.annotateCurrentSpan({ 'runner.id': state.handle.value.runnerId });
          const isRunning = yield* state.handle.value.process.isRunning.pipe(Effect.catch(() => Effect.succeed(false)));
          yield* Effect.annotateCurrentSpan({ 'runner.is_running': isRunning });
          if (isRunning) {
            return stateResult(void 0, state);
          }

          yield* closeScope(state.handle.value.scope);
          yield* runnerRegistry.markTerminated(state.handle.value.runnerId);
        }

        const runnerId = `local-${randomUUID()}`;
        const handle = yield* startRunner(runnerId).pipe(
          Effect.map(Option.some),
          Effect.catch((error) => Effect.logError(error).pipe(Effect.as(Option.none<RunnerHandle>()))),
        );

        if (Option.isNone(handle)) {
          yield* Effect.annotateCurrentSpan({ 'runner.started': false });
          return stateResult(void 0, { handle: Option.none() });
        }

        yield* Effect.annotateCurrentSpan({
          'runner.started': true,
          'runner.id': handle.value.runnerId,
        });
        return stateResult(void 0, { handle });
      }),
    ).pipe(Effect.withSpan('runner.manager.ensureActive'), Effect.provide(NodeServices.layer));

    const listActiveRunners = SynchronizedRef.modifyEffect(stateRef, (state) =>
      Effect.gen(function* () {
        const emptyList: ActiveRunnerList = [];
        if (Option.isNone(state.handle)) {
          yield* Effect.annotateCurrentSpan({ 'runner.list_count': 0 });
          return stateResult(emptyList, state);
        }

        const handle = state.handle.value;
        const isRunning = yield* handle.process.isRunning.pipe(Effect.catch(() => Effect.succeed(false)));

        if (!isRunning) {
          yield* closeScope(handle.scope);
          yield* runnerRegistry.markTerminated(handle.runnerId);
          yield* Effect.annotateCurrentSpan({ 'runner.list_count': 0, 'runner.is_running': false });
          return stateResult(emptyList, { handle: Option.none() });
        }

        const activeList = yield* runnerRegistry.listActiveRunners([handle.runnerId]);
        yield* Effect.annotateCurrentSpan({
          'runner.list_count': activeList.length,
          'runner.id': handle.runnerId,
          'runner.is_running': true,
        });
        return stateResult(activeList, state);
      }),
    ).pipe(Effect.withSpan('runner.manager.listActive'));

    const terminateRunner = (runnerId: string) =>
      SynchronizedRef.modifyEffect(stateRef, (state) =>
        Effect.gen(function* () {
          if (Option.isNone(state.handle)) {
            yield* Effect.annotateCurrentSpan({ 'runner.terminate_found': false });
            return stateResult(void 0, state);
          }

          const handle = state.handle.value;
          if (handle.runnerId !== runnerId) {
            yield* Effect.annotateCurrentSpan({
              'runner.terminate_found': false,
              'runner.id': handle.runnerId,
              'runner.requested_id': runnerId,
            });
            return stateResult(void 0, state);
          }

          yield* closeScope(handle.scope);
          yield* runnerRegistry.markTerminated(handle.runnerId);
          yield* Effect.annotateCurrentSpan({
            'runner.terminate_found': true,
            'runner.id': runnerId,
          });

          return stateResult(void 0, { handle: Option.none() });
        }),
      ).pipe(Effect.withSpan('runner.manager.terminate'), Effect.provide(NodeServices.layer));

    return {
      ensureRunnerActive,
      listActiveRunners,
      terminateRunner,
    };
  }),
);
