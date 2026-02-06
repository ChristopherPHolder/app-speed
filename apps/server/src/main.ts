import { NodeRuntime } from '@effect/platform-node';
import { Layer } from 'effect';
import { HttpLive } from './Http.js';
import { DevTools } from '@effect/experimental';

import { AuditRepoLive, DbClient } from '@app-speed/server/db';

const DevToolsLive = DevTools.layer('ws://localhost:34437');

HttpLive.pipe(
  Layer.provide(DevToolsLive),
  Layer.provide(AuditRepoLive),
  Layer.provide(DbClient.live),
  Layer.launch,
  NodeRuntime.runMain,
);
