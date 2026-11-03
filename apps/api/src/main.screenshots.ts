import { NodeRuntime } from '@effect/platform-node';
import { Config, Effect, Layer, Option } from 'effect';
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
import { ClerkIdentity, IdentityError, type SpaceAccess } from '@app-speed/platform/auth-api';
import { ServerConfig } from './Config/config.js';
import { HttpLive } from './http/Http.js';
import { InstalledAuditFeaturesLive } from './http/InstalledAuditFeatures.js';

const DemoIdentity = Layer.effect(ClerkIdentity)(
  Effect.gen(function* () {
    const enabled = yield* Config.Boolean('APP_SPEED_DEMO_CAPTURE');
    if (!enabled)
      return yield* new IdentityError({
        message: 'Demo identity is enabled only by the isolated journey capture target.',
      });
    const knownUser = (id: string) => id === 'user_demo_admin' || id === 'user_demo_member';
    return {
      publishableKey: '',
      identify: (headers: Readonly<Record<string, string | undefined>>) => {
        const user =
          headers['authorization']?.replace('Bearer ', '') ??
          headers['cookie']
            ?.split(';')
            .map((v) => v.trim())
            .find((v) => v.startsWith('capture-user='))
            ?.slice(13);
        return user && knownUser(user)
          ? Effect.succeed({ userId: user, sessionId: 'local-visual-review' })
          : Effect.succeed(null);
      },
      authorize: (userId: string, id: string) => {
        if (!knownUser(userId)) return Effect.fail(new IdentityError({ message: 'Unknown demo user.' }));
        if (id === `personal:${userId}`)
          return Effect.succeed<SpaceAccess>({ id, userId, kind: 'personal', role: 'admin' });
        if (id === 'org:demo_team')
          return Effect.succeed<SpaceAccess>({
            id,
            userId,
            kind: 'organization',
            role: userId === 'user_demo_admin' ? 'admin' : 'member',
          });
        return Effect.fail(new IdentityError({ message: 'Not a member of this demo space.' }));
      },
      exists: (id: string) =>
        Effect.succeed(
          id === 'org:demo_team' || id === 'personal:user_demo_admin' || id === 'personal:user_demo_member',
        ),
    };
  }),
);

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
      DemoIdentity,
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
