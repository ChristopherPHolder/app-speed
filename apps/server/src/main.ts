import { NodeRuntime } from '@effect/platform-node';
import { Layer } from 'effect';
import { HttpLive } from './Http.js';
import { DevTools } from '@effect/experimental';

import { AuditRepoLive, DbClient } from '@app-speed/server/db';
import { makeNodeObservabilityLayer } from '@app-speed/shared-observability';
import { LocalRunnerManagerLive } from './Runner/LocalRunnerManager.js';

const devToolsUrl = process.env.DEVTOOLS_URL;
const DevToolsLive = devToolsUrl ? DevTools.layer(devToolsUrl) : Layer.empty;
const ObservabilityLive = makeNodeObservabilityLayer({ serviceName: 'server' });

const BaseLayer = Layer.mergeAll(DevToolsLive, DbClient.live, ObservabilityLive);
const WithAuditRepo = Layer.provideMerge(AuditRepoLive, BaseLayer);
const AppLayer = Layer.provideMerge(LocalRunnerManagerLive, WithAuditRepo);

const MainLayer = Layer.provide(HttpLive, AppLayer);

NodeRuntime.runMain(Layer.launch(MainLayer));
