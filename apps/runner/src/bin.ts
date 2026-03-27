#!/usr/bin/env node
import { argv } from 'node:process';
import { Effect, Layer } from 'effect';
import { NodeContext, NodeHttpClient, NodeRuntime } from '@effect/platform-node';
import { makeNodeObservabilityLayer } from '@app-speed/platform/observability';
import { cli } from './cli';

const ObservabilityLive = makeNodeObservabilityLayer({ serviceName: 'runner' });
const RunnerRuntimeLayer = Layer.mergeAll(NodeContext.layer, NodeHttpClient.layer, ObservabilityLive);

cli(argv).pipe(
  Effect.provide(RunnerRuntimeLayer),
  NodeRuntime.runMain,
);
