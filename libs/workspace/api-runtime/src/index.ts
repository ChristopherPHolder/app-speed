import { Effect, Schema } from 'effect';
import { HttpServerRequest } from 'effect/http';
import { HttpApi, HttpApiBuilder, HttpApiEndpoint, HttpApiGroup } from 'effect/http-api';
import { Identity, IdentityUnavailable, SignInRequired } from '@app-speed/platform/identity';
import {
  WorkspaceActionSchema,
  WorkspaceConflict,
  WorkspaceForbidden,
  WorkspaceOverviewSchema,
  WorkspaceUnavailable,
} from '@app-speed/workspace/domain';
import { executeWorkspaceAction, loadWorkspaceOverview } from './management';

const errors = [SignInRequired, IdentityUnavailable, WorkspaceConflict, WorkspaceForbidden, WorkspaceUnavailable];
export class WorkspaceApiGroup extends HttpApiGroup.make('workspaces')
  .add(HttpApiEndpoint.get('overview', '/workspaces', { success: WorkspaceOverviewSchema, error: errors }))
  .add(
    HttpApiEndpoint.post('action', '/workspaces/actions', {
      payload: WorkspaceActionSchema,
      success: Schema.Struct({ id: Schema.String }),
      error: errors,
    }),
  ) {}

class WorkspaceApi extends HttpApi.make('api').add(WorkspaceApiGroup).prefix('/api') {}

const currentIdentity = Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest;
  const identity = yield* Identity;
  return yield* identity.authenticate(request.headers['authorization']);
});

export const WorkspaceGroupLive = HttpApiBuilder.group(WorkspaceApi, 'workspaces', (handlers) =>
  handlers
    .handle(
      'overview',
      Effect.fn('api.workspaces.overview')(function* () {
        return yield* loadWorkspaceOverview(yield* currentIdentity);
      }),
    )
    .handle(
      'action',
      Effect.fn('api.workspaces.action')(function* ({ payload }) {
        return yield* executeWorkspaceAction(yield* currentIdentity, payload);
      }),
    ),
);

export { WorkspaceStore, WorkspaceStoreLive, makeWorkspaceSql, runWorkspaceTransaction } from './store';
