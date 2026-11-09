import { Effect, Schema } from 'effect';
import type { AccountIdentity } from '@app-speed/platform/identity';
import {
  WorkspaceConflict,
  WorkspaceForbidden,
  WorkspaceLogoSchema,
  WorkspaceOverviewSchema,
  WorkspaceRole,
  type WorkspaceAction,
} from '@app-speed/workspace/domain';
import { WorkspaceStore, type WorkspaceSql } from './store';

const Row = Schema.Struct({ id: Schema.String });
const RoleRow = Schema.Struct({ role: WorkspaceRole });
const CountRow = Schema.Struct({ count: Schema.Number });
const forbidden = () => new WorkspaceForbidden({ message: 'You do not have access to this workspace or project.' });

const saveAccount = (sql: WorkspaceSql, account: AccountIdentity) =>
  sql(
    Schema.Unknown,
    `INSERT INTO accounts (id,email,name,image_url) VALUES ($1,$2,$3,$4)
   ON CONFLICT (id) DO UPDATE SET email=excluded.email,name=excluded.name,image_url=excluded.image_url`,
    [account.id, account.email, account.name, account.imageUrl],
  );

const requireMembership = Effect.fn('workspace.requireMembership')(function* (
  sql: WorkspaceSql,
  workspaceId: string,
  accountId: string,
  admin: boolean,
) {
  // All membership/project mutations lock the workspace before reading roles. This serializes last-admin decisions.
  const workspaces = yield* sql(Row, 'SELECT id FROM workspaces WHERE id=$1 FOR UPDATE', [workspaceId]);
  if (!workspaces.length) return yield* forbidden();
  const [membership] = yield* sql(
    RoleRow,
    'SELECT role FROM workspace_members WHERE workspace_id=$1 AND account_id=$2',
    [workspaceId, accountId],
  );
  if (!membership || (admin && membership.role !== 'admin')) return yield* forbidden();
  return membership;
});

const protectLastAdmin = Effect.fn('workspace.protectLastAdmin')(function* (
  sql: WorkspaceSql,
  workspaceId: string,
  accountId: string,
) {
  const [target] = yield* sql(RoleRow, 'SELECT role FROM workspace_members WHERE workspace_id=$1 AND account_id=$2', [
    workspaceId,
    accountId,
  ]);
  if (!target) return yield* forbidden();
  if (target.role === 'admin') {
    const [admins] = yield* sql(
      CountRow,
      "SELECT count(*)::integer AS count FROM workspace_members WHERE workspace_id=$1 AND role='admin'",
      [workspaceId],
    );
    if (!admins || admins.count <= 1)
      return yield* new WorkspaceConflict({
        message: 'Assign another admin before leaving, removing, or demoting the last admin.',
      });
  }
});

export const loadWorkspaceOverview = Effect.fn('workspace.overview')(function* (account: AccountIdentity) {
  const store = yield* WorkspaceStore;
  return yield* store.transaction((sql) =>
    Effect.gen(function* () {
      yield* saveAccount(sql, account);
      const workspaces = yield* sql(
        Schema.Struct({
          id: Schema.String,
          name: Schema.String,
          role: WorkspaceRole,
          logo: Schema.NullOr(WorkspaceLogoSchema),
        }),
        'SELECT w.id,w.name,w.logo,m.role FROM workspaces w JOIN workspace_members m ON m.workspace_id=w.id WHERE m.account_id=$1 ORDER BY w.created_at,w.id',
        [account.id],
      );
      const items = yield* Effect.forEach(workspaces, (workspace) =>
        Effect.gen(function* () {
          const members = yield* sql(
            Schema.Struct({ accountId: Schema.String, email: Schema.String, name: Schema.String, role: WorkspaceRole }),
            'SELECT a.id AS "accountId",a.email,a.name,m.role FROM workspace_members m JOIN accounts a ON a.id=m.account_id WHERE m.workspace_id=$1 ORDER BY a.name,a.id',
            [workspace.id],
          );
          const projects = yield* sql(
            Schema.Struct({ id: Schema.String, name: Schema.String, memberIds: Schema.Array(Schema.String) }),
            `SELECT p.id,p.name,ARRAY(SELECT pm.account_id FROM project_members pm WHERE pm.project_id=p.id ORDER BY pm.account_id) AS "memberIds"
         FROM projects p WHERE p.workspace_id=$1 AND ($2='admin' OR EXISTS(SELECT 1 FROM project_members pm WHERE pm.project_id=p.id AND pm.account_id=$3)) ORDER BY p.name,p.id`,
            [workspace.id, workspace.role, account.id],
          );
          const invitations =
            workspace.role === 'admin'
              ? yield* sql(
                  Schema.Struct({
                    id: Schema.String,
                    email: Schema.String,
                    role: WorkspaceRole,
                    expiresAt: Schema.String,
                  }),
                  'SELECT id,email,role,expires_at::text AS "expiresAt" FROM workspace_invitations WHERE workspace_id=$1 AND expires_at>now() ORDER BY email',
                  [workspace.id],
                )
              : [];
          return { ...workspace, members, projects, invitations };
        }),
      );
      const invitations = yield* sql(
        Schema.Struct({
          id: Schema.String,
          workspaceName: Schema.String,
          role: WorkspaceRole,
          expiresAt: Schema.String,
        }),
        `SELECT i.id,w.name AS "workspaceName",i.role,i.expires_at::text AS "expiresAt" FROM workspace_invitations i JOIN workspaces w ON w.id=i.workspace_id
       WHERE i.email=$1 AND i.expires_at>now() ORDER BY w.name`,
        [account.email],
      );
      return { account, workspaces: items, invitations } satisfies typeof WorkspaceOverviewSchema.Type;
    }),
  );
});

export const executeWorkspaceAction = Effect.fn('workspace.action')(function* (
  account: AccountIdentity,
  action: WorkspaceAction,
) {
  const store = yield* WorkspaceStore;
  return yield* store.transaction((sql) =>
    Effect.gen(function* () {
      yield* saveAccount(sql, account);
      if (action.action === 'createWorkspace') {
        const [workspace] = yield* sql(Row, 'INSERT INTO workspaces(name) VALUES($1) RETURNING id', [
          action.name.trim(),
        ]);
        if (!workspace) return yield* forbidden();
        yield* sql(
          Schema.Unknown,
          "INSERT INTO workspace_members(workspace_id,account_id,role) VALUES($1,$2,'admin')",
          [workspace.id, account.id],
        );
        yield* sql(Schema.Unknown, 'INSERT INTO projects(workspace_id,name) VALUES($1,$2)', [
          workspace.id,
          action.name.trim(),
        ]);
        return { id: workspace.id };
      }
      if (action.action === 'acceptInvitation' || action.action === 'declineInvitation') {
        const [invitation] = yield* sql(
          Schema.Struct({ workspaceId: Schema.String }),
          'SELECT workspace_id AS "workspaceId" FROM workspace_invitations WHERE id=$1 AND email=$2 AND expires_at>now()',
          [action.invitationId, account.email],
        );
        if (!invitation)
          return yield* new WorkspaceConflict({
            message: 'This invitation has expired or is no longer available for your verified email.',
          });
        yield* sql(Row, 'SELECT id FROM workspaces WHERE id=$1 FOR UPDATE', [invitation.workspaceId]);
        const [current] = yield* sql(
          RoleRow,
          'SELECT role FROM workspace_invitations WHERE id=$1 AND email=$2 AND expires_at>now() FOR UPDATE',
          [action.invitationId, account.email],
        );
        if (!current) return yield* new WorkspaceConflict({ message: 'This invitation is no longer available.' });
        if (action.action === 'acceptInvitation')
          yield* sql(
            Schema.Unknown,
            'INSERT INTO workspace_members(workspace_id,account_id,role) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',
            [invitation.workspaceId, account.id, current.role],
          );
        yield* sql(Schema.Unknown, 'DELETE FROM workspace_invitations WHERE id=$1', [action.invitationId]);
        return { id: invitation.workspaceId };
      }
      yield* requireMembership(sql, action.workspaceId, account.id, action.action !== 'leaveWorkspace');
      switch (action.action) {
        case 'renameWorkspace':
          yield* sql(Schema.Unknown, 'UPDATE workspaces SET name=$2 WHERE id=$1', [
            action.workspaceId,
            action.name.trim(),
          ]);
          break;
        case 'setWorkspaceLogo':
          yield* sql(Schema.Unknown, 'UPDATE workspaces SET logo=$2 WHERE id=$1', [action.workspaceId, action.logo]);
          break;
        case 'deleteWorkspace':
          yield* sql(Schema.Unknown, 'DELETE FROM workspaces WHERE id=$1', [action.workspaceId]);
          break;
        case 'inviteMember': {
          const email = action.email.toLowerCase().trim();
          const existing = yield* sql(
            Row,
            'SELECT a.id FROM accounts a JOIN workspace_members m ON m.account_id=a.id WHERE m.workspace_id=$1 AND a.email=$2',
            [action.workspaceId, email],
          );
          if (existing.length)
            return yield* new WorkspaceConflict({ message: 'This account is already a workspace member.' });
          yield* sql(
            Schema.Unknown,
            `INSERT INTO workspace_invitations(workspace_id,email,role,expires_at) VALUES($1,$2,$3,now()+interval '7 days')
           ON CONFLICT(workspace_id,email) DO UPDATE SET role=excluded.role,expires_at=excluded.expires_at`,
            [action.workspaceId, email, action.role],
          );
          break;
        }
        case 'revokeInvitation':
          yield* sql(Schema.Unknown, 'DELETE FROM workspace_invitations WHERE workspace_id=$1 AND id=$2', [
            action.workspaceId,
            action.invitationId,
          ]);
          break;
        case 'setRole':
          if (action.role !== 'admin') yield* protectLastAdmin(sql, action.workspaceId, action.accountId);
          yield* sql(Schema.Unknown, 'UPDATE workspace_members SET role=$3 WHERE workspace_id=$1 AND account_id=$2', [
            action.workspaceId,
            action.accountId,
            action.role,
          ]);
          break;
        case 'removeMember':
        case 'leaveWorkspace': {
          const accountId = action.action === 'leaveWorkspace' ? account.id : action.accountId;
          yield* protectLastAdmin(sql, action.workspaceId, accountId);
          yield* sql(Schema.Unknown, 'DELETE FROM workspace_members WHERE workspace_id=$1 AND account_id=$2', [
            action.workspaceId,
            accountId,
          ]);
          break;
        }
        case 'createProject': {
          const [project] = yield* sql(Row, 'INSERT INTO projects(workspace_id,name) VALUES($1,$2) RETURNING id', [
            action.workspaceId,
            action.name.trim(),
          ]);
          if (!project) return yield* forbidden();
          return { id: project.id };
        }
        case 'renameProject':
        case 'deleteProject':
        case 'grantProjectAccess':
        case 'revokeProjectAccess': {
          const projects = yield* sql(Row, 'SELECT id FROM projects WHERE id=$1 AND workspace_id=$2', [
            action.projectId,
            action.workspaceId,
          ]);
          if (!projects.length) return yield* forbidden();
          if (action.action === 'renameProject')
            yield* sql(Schema.Unknown, 'UPDATE projects SET name=$2 WHERE id=$1', [
              action.projectId,
              action.name.trim(),
            ]);
          if (action.action === 'deleteProject')
            yield* sql(Schema.Unknown, 'DELETE FROM projects WHERE id=$1', [action.projectId]);
          if (action.action === 'grantProjectAccess') {
            const members = yield* sql(
              RoleRow,
              'SELECT role FROM workspace_members WHERE workspace_id=$1 AND account_id=$2',
              [action.workspaceId, action.accountId],
            );
            if (!members.length) return yield* forbidden();
            yield* sql(
              Schema.Unknown,
              'INSERT INTO project_members(workspace_id,project_id,account_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',
              [action.workspaceId, action.projectId, action.accountId],
            );
          }
          if (action.action === 'revokeProjectAccess')
            yield* sql(Schema.Unknown, 'DELETE FROM project_members WHERE project_id=$1 AND account_id=$2', [
              action.projectId,
              action.accountId,
            ]);
          break;
        }
      }
      return { id: action.workspaceId };
    }),
  );
});
