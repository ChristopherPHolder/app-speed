import { Config, Effect, Option } from 'effect';

export type RunnerManagerMode = 'local' | 'aws';

const RunnerManagerModeConfig = Config.option(Config.literal('local', 'aws')('RUNNER_MANAGER_MODE'));
const DevToolsUrlConfig = Config.option(Config.string('DEVTOOLS_URL'));

export type ServerRuntimeConfig = {
  devToolsUrl: Option.Option<string>;
  runnerManagerMode: RunnerManagerMode;
};

export const resolveRunnerManagerMode = Effect.gen(function* () {
  const configuredMode = yield* RunnerManagerModeConfig;
  return Option.getOrElse(configuredMode, () => 'aws' as const);
});

export const ServerConfig = Effect.gen(function* () {
  const devToolsUrl = yield* DevToolsUrlConfig;
  const runnerManagerMode = yield* resolveRunnerManagerMode;

  return {
    devToolsUrl,
    runnerManagerMode,
  } satisfies ServerRuntimeConfig;
});
