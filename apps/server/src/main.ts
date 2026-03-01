import { NodeRuntime } from '@effect/platform-node';
import { Effect, Layer, Option } from 'effect';
import { HttpLive } from './Http.js';
import { DevTools } from '@effect/experimental';

import { AuditRepoLive, DbClient } from '@app-speed/server/db';
import { makeNodeObservabilityLayer } from '@app-speed/shared-observability';
import { LocalRunnerManagerLive } from './Runner/LocalRunnerManager.js';
import { AwsRunnerManagerLive } from './Runner/AwsRunnerManager.js';
import { resolveServerRuntimeConfig } from './runtime-config.js';

const ObservabilityLive = makeNodeObservabilityLayer({ serviceName: 'server' });
const MainLayer = Layer.unwrapEffect(
  Effect.gen(function* () {
    const runtimeConfig = yield* resolveServerRuntimeConfig;

    const DevToolsLive = Option.match(runtimeConfig.devToolsUrl, {
      onNone: () => Layer.empty,
      onSome: (url) => DevTools.layer(url),
    });
    const RunnerManagerLive =
      runtimeConfig.runnerManagerMode === 'aws' ? AwsRunnerManagerLive : LocalRunnerManagerLive;
    const BaseLayer = Layer.mergeAll(DevToolsLive, DbClient.live, ObservabilityLive);
    const WithAuditRepo = Layer.provideMerge(AuditRepoLive, BaseLayer);
    const AppLayer = Layer.provideMerge(RunnerManagerLive, WithAuditRepo);

    return Layer.provide(HttpLive, AppLayer);
  }),
);

NodeRuntime.runMain(Layer.launch(MainLayer));
