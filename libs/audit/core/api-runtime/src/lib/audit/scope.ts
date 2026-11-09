import { Effect, Schema } from 'effect';
import { HttpServerRequest } from 'effect/http';
import { HttpApiError } from 'effect/http-api';
import { Identity } from '@app-speed/platform/identity';
import { WorkspaceStore } from '@app-speed/workspace/api-runtime';

const projectIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolves whether `accountId` may use `projectId`: current workspace membership plus either the admin role or an
 * explicit project grant. Returns `null` when access is denied, the project is unknown or the ID is malformed.
 */
export const authorizedAuditProject = Effect.fn('audit.authorizedProject')(function* (
  accountId: string,
  projectId: string,
) {
  if (!projectIdPattern.test(projectId)) return null;
  const store = yield* WorkspaceStore;
  const rows = yield* store.transaction((sql) =>
    sql(
      Schema.Struct({ id: Schema.String }),
      `SELECT p.id FROM projects p JOIN workspace_members m ON m.workspace_id=p.workspace_id
     WHERE p.id=$1 AND m.account_id=$2 AND (m.role='admin' OR EXISTS
       (SELECT 1 FROM project_members pm WHERE pm.project_id=p.id AND pm.account_id=m.account_id))`,
      [projectId, accountId],
    ),
  );
  return rows[0]?.id ?? null;
});

// A project selection is only a filter. Membership and explicit project grants are checked afresh.
export const auditRequestProject = Effect.fn('audit.authorizeProject')(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest;
  const projectId = request.headers['x-project-id'];
  if (projectId === undefined) return null;
  if (!projectIdPattern.test(projectId)) return yield* new HttpApiError.Forbidden();
  const identity = yield* Identity;
  const account = yield* identity
    .authenticate(request.headers['authorization'])
    .pipe(Effect.mapError(() => new HttpApiError.Forbidden()));
  const project = yield* authorizedAuditProject(account.id, projectId).pipe(
    Effect.mapError(() => new HttpApiError.Forbidden()),
  );
  if (!project) return yield* new HttpApiError.Forbidden();
  return project;
});
