#!/usr/bin/env node
import { argv } from 'node:process';
import { Effect, Layer } from 'effect';
import { NodeHttpClient, NodeRuntime, NodeServices } from '@effect/platform-node';
import { makeNodeObservabilityLayer } from '@app-speed/platform/observability';
import { cli } from './cli';
import { InstalledAuditExecutorLive } from './InstalledAuditExecutor';

const ObservabilityLive = makeNodeObservabilityLayer({ serviceName: 'runner' });
const RunnerRuntimeLayer = Layer.mergeAll(
  NodeServices.layer,
  NodeHttpClient.layerNodeHttp,
  ObservabilityLive,
  InstalledAuditExecutorLive,
);

cli(argv.slice(2)).pipe(Effect.provide(RunnerRuntimeLayer), NodeRuntime.runMain);
