import { NodeRuntime } from '@effect/platform-node';
import { Layer } from 'effect';
import { HttpLive } from './Http.js';
import { AuditRepo } from './Audit/AuditRepo.js';
import { DevTools } from '@effect/experimental';
import { AuditQueueLive } from './Audit/AuditQueue';

import { DbClient } from '@app-speed/server/db';

const DevToolsLive = DevTools.layer('ws://localhost:34437');

HttpLive.pipe(
  Layer.provide(DevToolsLive),
  Layer.provide(AuditRepo.Default),
  Layer.provide(AuditQueueLive),
  Layer.provide(DbClient.live),
  Layer.launch,
  NodeRuntime.runMain,
);
