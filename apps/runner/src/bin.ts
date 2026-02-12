#!/usr/bin/env node
import { argv } from 'node:process';
import { Effect } from 'effect';
import { NodeContext, NodeHttpClient, NodeRuntime } from '@effect/platform-node';
import { cli } from './cli';
import { ObservabilityLive } from './Observability.js';

cli(argv).pipe(
  Effect.provide(NodeContext.layer),
  Effect.provide(NodeHttpClient.layer),
  Effect.provide(ObservabilityLive),
  NodeRuntime.runMain,
);
