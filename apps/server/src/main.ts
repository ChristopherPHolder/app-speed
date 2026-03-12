import { NodeRuntime } from '@effect/platform-node';
import { Effect, Layer, Option } from 'effect';
import { HttpLive } from './Http.js';
import { DevTools } from '@effect/experimental';

import { AuditRepoLive, DbClient } from '@app-speed/server/db';
import { makeNodeObservabilityLayer } from '@app-speed/shared-observability';
import { LocalRunnerManagerLive } from './Runner/LocalRunnerManager.js';
import { AwsRunnerManagerLive } from './Runner/AwsRunnerManager.js';
import { ServerConfig } from './Config/config.js';
import { RunnerRegistryLive } from './Runner/RunnerRegistry.js';
import { RunnerIdleReaperLive } from './Runner/RunnerIdleReaper.js';
import { RunnerLifecycleLive } from './Runner/RunnerLifecycle.js';

const ObservabilityLive = makeNodeObservabilityLayer({ serviceName: 'server' });
const MainLayer = Layer.unwrapEffect(
  Effect.gen(function* () {
    const runtimeConfig = yield* ServerConfig;

    const DevToolsLive = Option.match(runtimeConfig.devToolsUrl, {
      onNone: () => Layer.empty,
      onSome: (url) => DevTools.layer(url),
    });
    const RunnerManagerLive = runtimeConfig.runnerManagerMode === 'aws' ? AwsRunnerManagerLive : LocalRunnerManagerLive;
    const BaseLayer = Layer.mergeAll(DevToolsLive, DbClient.live, ObservabilityLive, RunnerRegistryLive);
    const WithAuditRepo = Layer.provideMerge(AuditRepoLive, BaseLayer);
    const WithRunnerManager = Layer.provideMerge(RunnerManagerLive, WithAuditRepo);
    const AppLayer = Layer.provideMerge(RunnerLifecycleLive, WithRunnerManager);
    const RuntimeLayer = Layer.mergeAll(HttpLive, RunnerIdleReaperLive);

    return Layer.provide(RuntimeLayer, AppLayer);
  }),
);

NodeRuntime.runMain(Layer.launch(MainLayer));
