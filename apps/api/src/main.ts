import { NodeRuntime } from '@effect/platform-node';
import { Effect, Layer, Option } from 'effect';
import { DevTools } from 'effect/devtools';
import {
  AwsRunnerManagerLive,
  LocalRunnerManagerLive,
  ManualRunnerManagerLive,
  RunnerIdleReaperLive,
  RunnerLifecycleLive,
  RunnerRegistryLive,
} from '@app-speed/audit/core/api-runtime';
import {
  SqliteDbClient,
  SqliteAuditRepoLive,
  SqliteAuditHistoryRepoLive,
  SqliteRecordPersistenceLive,
  productionStorage,
  AuditHistoryRepoLive,
  AuditRepoLive,
  DbClient,
  RecordPersistenceLive,
} from '@app-speed/audit/core/persistence';
import {
  SqliteUserFlowAuditRepoLive,
  SqliteUserFlowAuditSchedulerLive,
  UserFlowAuditRepoLive,
  UserFlowAuditSchedulerLive,
} from '@app-speed/audit/user-flow/persistence';
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
    const production = yield* productionStorage;
    const PostgresBase = Layer.mergeAll(DbClient.live, RecordPersistenceLive);
    const PostgresRepos = Layer.provideMerge(AuditHistoryRepoLive, Layer.provideMerge(AuditRepoLive, PostgresBase));
    const PostgresPersistence = Layer.provideMerge(
      UserFlowAuditSchedulerLive,
      Layer.provideMerge(UserFlowAuditRepoLive, PostgresRepos),
    );
    const SqliteBase = Layer.provideMerge(SqliteRecordPersistenceLive, SqliteDbClient.live);
    const SqliteRepos = Layer.provideMerge(
      SqliteAuditHistoryRepoLive,
      Layer.provideMerge(SqliteAuditRepoLive, SqliteBase),
    );
    const SqlitePersistence = Layer.provideMerge(
      SqliteUserFlowAuditSchedulerLive,
      Layer.provideMerge(SqliteUserFlowAuditRepoLive, SqliteRepos),
    );
    const BaseLayer = Layer.mergeAll(
      DevToolsLive,
      production ? PostgresPersistence : SqlitePersistence,
      ObservabilityLive,
      RunnerRegistryLive,
    );
    const WithUserFlowScheduler = Layer.provideMerge(InstalledAuditFeaturesLive, BaseLayer);
    const WithRunnerManager = Layer.provideMerge(RunnerManagerLive, WithUserFlowScheduler);
    const AppLayer = Layer.provideMerge(RunnerLifecycleLive, WithRunnerManager);
    const RuntimeLayer = Layer.mergeAll(HttpLive, RunnerIdleReaperLive);

    return Layer.provide(RuntimeLayer, AppLayer);
  }),
);

NodeRuntime.runMain(Layer.launch(MainLayer));
