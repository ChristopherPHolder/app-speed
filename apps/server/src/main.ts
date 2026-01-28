import { NodeRuntime } from '@effect/platform-node';
import { Layer } from 'effect';
import { HttpLive } from './Http.js';
import { AuditRepo } from './Audit/AuditRepo.js';
import { DevTools } from '@effect/experimental';
import { DbClientServiceLive } from './Db';
import { AuditQueueLive } from './Audit/AuditQueue';

const DevToolsLive = DevTools.layer('ws://localhost:34437');

HttpLive.pipe(
  Layer.provide(DevToolsLive),
  Layer.provide(AuditRepo.Default),
  Layer.provide(AuditQueueLive),
  Layer.provide(DbClientServiceLive),
  Layer.launch,
  NodeRuntime.runMain,
);
