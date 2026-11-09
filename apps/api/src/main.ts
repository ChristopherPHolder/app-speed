import { IdentityLive } from '@app-speed/platform/identity';
import { WorkspaceStoreLive } from '@app-speed/workspace/api-runtime';
import { NodeRuntime } from '@effect/platform-node';
import { Layer } from 'effect';
import { makeMainLayer } from './AppLive.js';

NodeRuntime.runMain(Layer.launch(makeMainLayer(Layer.mergeAll(IdentityLive, WorkspaceStoreLive))));
