import { NodeRuntime } from '@effect/platform-node';
import { Effect, Layer, Option } from 'effect';
import { DevTools } from '@effect/experimental';
import {
  AwsRunnerManagerLive,
  HttpLive,
  LocalRunnerManagerLive,
  RunnerIdleReaperLive,
  RunnerLifecycleLive,
  RunnerRegistryLive,
} from '@app-speed/audit/control-plane';
import { AuditRepoLive, DbClient } from '@app-speed/audit/persistence';
import { makeNodeObservabilityLayer } from '@app-speed/platform/observability';
import { ServerConfig } from './Config/config.js';

const ObservabilityLive = makeNodeObservabilityLayer({ serviceName: 'api' });
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
