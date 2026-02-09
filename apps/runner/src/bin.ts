#!/usr/bin/env node
import { argv } from 'node:process';
import { Effect } from 'effect';
import { NodeContext, NodeHttpClient, NodeRuntime } from '@effect/platform-node';
import { cli } from './cli';

cli(argv).pipe(Effect.provide(NodeContext.layer), Effect.provide(NodeHttpClient.layer), NodeRuntime.runMain);
