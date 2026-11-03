import { NodeRuntime } from '@effect/platform-node';
import { Effect, Layer, Option } from 'effect';
import { DevTools } from 'effect/devtools';
import {
  AuditAccess,
  AwsRunnerManagerLive,
  LocalRunnerManagerLive,
  ManualRunnerManagerLive,
  RunnerIdleReaperLive,
  RecurringPollerLive,
  RunnerLifecycleLive,
  RunnerRegistryLive,
} from '@app-speed/audit/core/api-runtime';
import {
  AuditHistoryRepoLive,
  AuditRepoLive,
  DbClient,
  RecordPersistenceLive,
  RecurringDispatch,
} from '@app-speed/audit/core/persistence';
import {
  SpaceAuditRepo,
  UserFlowAuditRepoLive,
  UserFlowAuditSchedulerLive,
} from '@app-speed/audit/user-flow/persistence';
import { makeNodeObservabilityLayer } from '@app-speed/platform/observability';
import { ClerkIdentity } from '@app-speed/platform/auth-api';
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
      ClerkIdentity.live,
      ObservabilityLive,
      RunnerRegistryLive,
      RecordPersistenceLive,
    );
    const WithAccess = Layer.provideMerge(AuditAccess.live, BaseLayer);
    const WithDispatch = Layer.provideMerge(RecurringDispatch.live, WithAccess);
    const WithAuditRepo = Layer.provideMerge(AuditRepoLive, WithDispatch);
    const WithAuditHistory = Layer.provideMerge(AuditHistoryRepoLive, WithAuditRepo);
    const WithSpaceAudits = Layer.provideMerge(SpaceAuditRepo.live, WithAuditHistory);
    const WithUserFlowRepo = Layer.provideMerge(UserFlowAuditRepoLive, WithSpaceAudits);
    const WithInstalledFeatures = Layer.provideMerge(InstalledAuditFeaturesLive, WithUserFlowRepo);
    const WithUserFlowScheduler = Layer.provideMerge(UserFlowAuditSchedulerLive, WithInstalledFeatures);
    const WithRunnerManager = Layer.provideMerge(RunnerManagerLive, WithUserFlowScheduler);
    const AppLayer = Layer.provideMerge(RunnerLifecycleLive, WithRunnerManager);
    const RuntimeLayer = Layer.mergeAll(HttpLive, RunnerIdleReaperLive, RecurringPollerLive);

    return Layer.provide(RuntimeLayer, AppLayer);
  }),
);

NodeRuntime.runMain(Layer.launch(MainLayer));
