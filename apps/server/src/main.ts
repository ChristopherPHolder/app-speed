import { NodeRuntime } from '@effect/platform-node';
import { Layer } from 'effect';
import { HttpLive } from './Http.js';
import { AuditRepo } from './Audit/AuditRepo.js';
import { DevTools } from '@effect/experimental';
import { DbClientServiceLive } from './Db';

const DevToolsLive = DevTools.layer('ws://localhost:34437');

HttpLive.pipe(
  Layer.provide(DevToolsLive),
  Layer.provide(AuditRepo.Default),
  Layer.provide(DbClientServiceLive),
  Layer.launch,
  NodeRuntime.runMain,
);
