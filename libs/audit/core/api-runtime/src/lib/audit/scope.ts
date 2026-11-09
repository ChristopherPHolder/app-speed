import { Effect, Schema } from 'effect';
import { HttpServerRequest } from 'effect/http';
import { HttpApiError } from 'effect/http-api';
import { Identity } from '@app-speed/platform/identity';
import { WorkspaceStore } from '@app-speed/workspace/api-runtime';

// A project selection is only a filter. Membership and explicit project grants are checked afresh.
export const auditRequestProject = Effect.fn('audit.authorizeProject')(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest;
  const projectId = request.headers['x-project-id'];
  if (projectId === undefined) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId))
    return yield* new HttpApiError.Forbidden();
  const identity = yield* Identity;
  const account = yield* identity
    .authenticate(request.headers['authorization'])
    .pipe(Effect.mapError(() => new HttpApiError.Forbidden()));
  const store = yield* WorkspaceStore;
  const rows = yield* store
    .transaction((sql) =>
      sql(
        Schema.Struct({ id: Schema.String }),
        `SELECT p.id FROM projects p JOIN workspace_members m ON m.workspace_id=p.workspace_id
     WHERE p.id=$1 AND m.account_id=$2 AND (m.role='admin' OR EXISTS
       (SELECT 1 FROM project_members pm WHERE pm.project_id=p.id AND pm.account_id=m.account_id))`,
        [projectId, account.id],
      ),
    )
    .pipe(Effect.mapError(() => new HttpApiError.Forbidden()));
  const [project] = rows;
  if (!project) return yield* new HttpApiError.Forbidden();
  return project.id;
});
