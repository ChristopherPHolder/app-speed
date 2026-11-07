import { IdentityLive } from '@app-speed/platform/identity';
import { NodeRuntime } from '@effect/platform-node';
import { Layer } from 'effect';
import { makeMainLayer } from './AppLive.js';
import { WorkspaceTestStoreLive } from './testing/workspace-store.js';
NodeRuntime.runMain(Layer.launch(makeMainLayer(Layer.mergeAll(IdentityLive, WorkspaceTestStoreLive))));
