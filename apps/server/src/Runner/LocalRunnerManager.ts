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

const runnerCommand = Command.make('npx', 'nx', 'execute', 'runner-app').pipe(
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
  return { process, scope } satisfies RunnerHandle;
});

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
          const isRunning = yield* state.handle.value.process.isRunning.pipe(
            Effect.catchAll(() => Effect.succeed(false)),
          );
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
          return [void 0, { handle: Option.none(), lastHeartbeatAt: null }] as const;
        }

        return [
          void 0,
          {
            handle,
            lastHeartbeatAt: new Date(),
          },
        ] as const;
      }),
    ).pipe(Effect.provide(NodeContext.layer));

    const listActiveRunners = SynchronizedRef.modifyEffect(stateRef, (state) =>
      Effect.gen(function* () {
        const emptyList: ActiveRunnerList = [];
        if (Option.isNone(state.handle)) {
          return [emptyList, state] as const;
        }

        const processHandle = state.handle.value.process;
        const isRunning = yield* processHandle.isRunning.pipe(Effect.catchAll(() => Effect.succeed(false)));

        if (!isRunning) {
          yield* closeScope(state.handle.value.scope);
          return [emptyList, { handle: Option.none(), lastHeartbeatAt: null }] as const;
        }

        const lastHeartbeatAt = state.lastHeartbeatAt ?? new Date();
        const activeList: ActiveRunnerList = [{ id: toRunnerId(runnerIdFor(processHandle)), lastHeartbeatAt }];
        return [activeList, { handle: state.handle, lastHeartbeatAt }] as const;
      }),
    );

    const terminateRunner = (runnerId: string) =>
      SynchronizedRef.modifyEffect(stateRef, (state) =>
        Effect.gen(function* () {
          if (Option.isNone(state.handle)) {
            return [void 0, state] as const;
          }

          const processHandle = state.handle.value.process;
          if (runnerIdFor(processHandle) !== runnerId) {
            return [void 0, state] as const;
          }

          yield* closeScope(state.handle.value.scope);

          return [void 0, { handle: Option.none(), lastHeartbeatAt: null }] as const;
        }),
      ).pipe(Effect.provide(NodeContext.layer));

    return {
      ensureRunnerActive,
      listActiveRunners,
      terminateRunner,
    };
  }),
);
