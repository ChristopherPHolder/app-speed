import { NodeRuntime } from '@effect/platform-node';
import { Effect, Layer, Option } from 'effect';
import { DevTools } from 'effect/unstable/devtools';
import {
  AwsRunnerManagerLive,
  LocalRunnerManagerLive,
  ManualRunnerManagerLive,
  RunnerIdleReaperLive,
  RunnerLifecycleLive,
  RunnerRegistryLive,
} from '@app-speed/audit/core/api-runtime';
import {
  AuditHistoryRepoLive,
  AuditRepoLive,
  DbClient,
  RecordPersistenceLive,
} from '@app-speed/audit/core/persistence';
import { UserFlowAuditRepoLive, UserFlowAuditSchedulerLive } from '@app-speed/audit/user-flow/persistence';
import { makeNodeObservabilityLayer } from '@app-speed/platform/observability';
import { ServerConfig } from './Config/config.js';
import { HttpLive } from './http/Http.js';
import { InstalledAuditFeaturesLive } from './http/InstalledAuditFeatures.js';

const ObservabilityLive = makeNodeObservabilityLayer({ serviceName: 'api' });
const MainLayer = Layer.unwrap(
  Effect.gen(function* () {
    const runtimeConfig = yield* ServerConfig;

    const DevToolsLive = Option.match(runtimeConfig.devToolsUrl, {
      onNone: () => Layer.empty,
      onSome: (url) => DevTools.layer(url),
    });
    const RunnerManagerLive =
      runtimeConfig.runnerManagerMode === 'aws'
        ? AwsRunnerManagerLive
        : runtimeConfig.runnerManagerMode === 'manual'
          ? ManualRunnerManagerLive
          : LocalRunnerManagerLive;
    const BaseLayer = Layer.mergeAll(
      DevToolsLive,
      DbClient.live,
      ObservabilityLive,
      RunnerRegistryLive,
      RecordPersistenceLive,
    );
    const WithAuditRepo = Layer.provideMerge(AuditRepoLive, BaseLayer);
    const WithAuditHistory = Layer.provideMerge(AuditHistoryRepoLive, WithAuditRepo);
    const WithUserFlowRepo = Layer.provideMerge(UserFlowAuditRepoLive, WithAuditHistory);
    const WithInstalledFeatures = Layer.provideMerge(InstalledAuditFeaturesLive, WithUserFlowRepo);
    const WithUserFlowScheduler = Layer.provideMerge(UserFlowAuditSchedulerLive, WithInstalledFeatures);
    const WithRunnerManager = Layer.provideMerge(RunnerManagerLive, WithUserFlowScheduler);
    const AppLayer = Layer.provideMerge(RunnerLifecycleLive, WithRunnerManager);
    const RuntimeLayer = Layer.mergeAll(HttpLive, RunnerIdleReaperLive);

    return Layer.provide(RuntimeLayer, AppLayer);
  }),
);

NodeRuntime.runMain(Layer.launch(MainLayer));
