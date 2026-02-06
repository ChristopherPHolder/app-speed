import { NodeRuntime } from '@effect/platform-node';
import { Layer } from 'effect';
import { HttpLive } from './Http.js';
import { DevTools } from '@effect/experimental';

import { AuditRepoLive, DbClient } from '@app-speed/server/db';
import { RunnerServiceLive } from './Runner/RunnerService.js';

const devToolsUrl = process.env.DEVTOOLS_URL;
const DevToolsLive = devToolsUrl ? DevTools.layer(devToolsUrl) : Layer.empty;

const BaseLayer = Layer.mergeAll(DevToolsLive, DbClient.live);
const WithAuditRepo = Layer.provideMerge(AuditRepoLive, BaseLayer);
const AppLayer = Layer.provideMerge(RunnerServiceLive, WithAuditRepo);

const MainLayer = Layer.provide(HttpLive, AppLayer);

Layer.launch(MainLayer).pipe(NodeRuntime.runMain);
