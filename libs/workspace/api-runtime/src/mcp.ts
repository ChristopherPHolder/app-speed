import { Effect, Layer, Schema } from 'effect';
import { McpServer, Tool, Toolkit } from 'effect/ai';
import { currentMcpClient, McpCaller, McpToolError, toolError } from '@app-speed/platform/mcp';
import {
  WorkspaceActionSchema,
  WorkspaceLogoSchema,
  WorkspaceOverviewSchema,
  WorkspaceRole,
  type WorkspaceAction,
  type WorkspaceOverview,
} from '@app-speed/workspace/domain';

import { executeWorkspaceAction, loadWorkspaceOverview } from './management';
import { WorkspaceStore } from './store';

const WorkspaceId = Schema.String.annotate({ description: 'Workspace ID from get_workspaces.' });
const ProjectId = Schema.String.annotate({ description: 'Project ID from get_workspaces.' });
const AccountId = Schema.String.annotate({ description: 'Member account ID from get_workspaces.' });
const InvitationId = Schema.String.annotate({ description: 'Invitation ID from get_workspaces.' });
const Name = Schema.String.annotate({ description: '1-100 characters.' });
const Confirm = (target: string) =>
  Schema.String.annotate({
    description: `Must exactly match the ${target}. Confirm with the user before calling; this cannot be undone.`,
  });
const Changed = Schema.Struct({ id: Schema.String });

type Hints = { readonly readonly?: boolean; readonly destructive: boolean; readonly idempotent?: boolean };
const hint =
  (title: string, hints: Hints) =>
  <T extends Tool.Any>(tool: T): T =>
    tool
      .annotate(Tool.Title, title)
      .annotate(Tool.Readonly, hints.readonly ?? false)
      .annotate(Tool.Destructive, hints.destructive)
      .annotate(Tool.Idempotent, hints.idempotent ?? false)
      .annotate(Tool.OpenWorld, false) as T;

const action = <const Name extends string, Fields extends Schema.Struct.Fields>(
  name: Name,
  description: string,
  fields: Fields,
) =>
  Tool.make(name, {
    description,
    parameters: Schema.Struct(fields),
    success: Changed,
    failure: McpToolError,
    dependencies: [McpCaller],
  });

export const GetWorkspaces = hint('Get workspaces and projects', {
  readonly: true,
  destructive: false,
  idempotent: true,
})(
  Tool.make('get_workspaces', {
    description:
      'Lists the signed-in account, its workspaces (role, members, projects, pending invitations it manages) and ' +
      'invitations waiting for the account. Start here: other tools take the workspace and project IDs listed here.',
    success: WorkspaceOverviewSchema,
    failure: McpToolError,
    dependencies: [McpCaller],
  }),
);

export const CreateWorkspace = hint('Create workspace', { destructive: false })(
  action('create_workspace', 'Creates a workspace and its first, same-named project.', {
    name: Name,
  }),
);
export const RenameWorkspace = hint('Rename workspace', { destructive: true, idempotent: true })(
  action('rename_workspace', 'Renames a workspace. Requires admin.', {
    workspaceId: WorkspaceId,
    name: Name,
  }),
);
export const SetWorkspaceLogo = hint('Set workspace logo', { destructive: true, idempotent: true })(
  action(
    'set_workspace_logo',
    'Sets or removes (null) a workspace logo. Requires admin. The logo must be a 128×128 PNG data URL.',
    { workspaceId: WorkspaceId, logo: Schema.NullOr(WorkspaceLogoSchema) },
  ),
);
export const DeleteWorkspace = hint('Delete workspace', { destructive: true })(
  action(
    'delete_workspace',
    'Permanently deletes a workspace with its projects, memberships and invitations. Requires admin.',
    { workspaceId: WorkspaceId, confirm: Confirm('workspace name') },
  ),
);
export const InviteMember = hint('Invite member', { destructive: false })(
  action(
    'invite_member',
    'Invites an email address to a workspace with a role. Requires admin. The invitation expires after 7 days.',
    { workspaceId: WorkspaceId, email: Schema.String, role: WorkspaceRole },
  ),
);
export const RevokeInvitation = hint('Revoke invitation', { destructive: true })(
  action('revoke_invitation', 'Revokes a pending invitation. Requires admin.', {
    workspaceId: WorkspaceId,
    invitationId: InvitationId,
    confirm: Confirm('invited email address'),
  }),
);
export const AcceptInvitation = hint('Accept invitation', { destructive: false })(
  action(
    'accept_invitation',
    "Accepts an invitation addressed to the account's verified email and joins the workspace.",
    { invitationId: InvitationId },
  ),
);
export const DeclineInvitation = hint('Decline invitation', { destructive: true })(
  action('decline_invitation', "Declines an invitation addressed to the account's verified email.", {
    invitationId: InvitationId,
  }),
);
export const SetMemberRole = hint('Set member role', { destructive: true, idempotent: true })(
  action(
    'set_member_role',
    'Changes a member role (admin or member). Requires admin. The last admin cannot be demoted.',
    { workspaceId: WorkspaceId, accountId: AccountId, role: WorkspaceRole },
  ),
);
export const RemoveMember = hint('Remove member', { destructive: true })(
  action(
    'remove_member',
    'Removes a member and their project access from a workspace. Requires admin. The last admin cannot be removed.',
    { workspaceId: WorkspaceId, accountId: AccountId, confirm: Confirm("member's email address") },
  ),
);
export const LeaveWorkspace = hint('Leave workspace', { destructive: true })(
  action('leave_workspace', 'Removes the signed-in account from a workspace. The last admin cannot leave.', {
    workspaceId: WorkspaceId,
    confirm: Confirm('workspace name'),
  }),
);
export const CreateProject = hint('Create project', { destructive: false })(
  action('create_project', 'Creates a project in a workspace. Requires admin.', {
    workspaceId: WorkspaceId,
    name: Name,
  }),
);
export const RenameProject = hint('Rename project', { destructive: true, idempotent: true })(
  action('rename_project', 'Renames a project. Requires admin.', {
    workspaceId: WorkspaceId,
    projectId: ProjectId,
    name: Name,
  }),
);
export const DeleteProject = hint('Delete project', { destructive: true })(
  action('delete_project', 'Deletes a project. Requires admin. Its audits stay private and are no longer reachable.', {
    workspaceId: WorkspaceId,
    projectId: ProjectId,
    confirm: Confirm('project name'),
  }),
);
export const GrantProjectAccess = hint('Grant project access', { destructive: false, idempotent: true })(
  action(
    'grant_project_access',
    'Grants a workspace member access to a project. Requires admin. Admins can access every project.',
    { workspaceId: WorkspaceId, projectId: ProjectId, accountId: AccountId },
  ),
);
export const RevokeProjectAccess = hint('Revoke project access', { destructive: true })(
  action('revoke_project_access', "Revokes a member's access to a project. Requires admin.", {
    workspaceId: WorkspaceId,
    projectId: ProjectId,
    accountId: AccountId,
    confirm: Confirm("member's email address"),
  }),
);

export const WorkspaceMcpToolkit = Toolkit.make(
  GetWorkspaces,
  CreateWorkspace,
  RenameWorkspace,
  SetWorkspaceLogo,
  DeleteWorkspace,
  InviteMember,
  RevokeInvitation,
  AcceptInvitation,
  DeclineInvitation,
  SetMemberRole,
  RemoveMember,
  LeaveWorkspace,
  CreateProject,
  RenameProject,
  DeleteProject,
  GrantProjectAccess,
  RevokeProjectAccess,
);

const normalize = (value: string) => value.trim().toLowerCase();

/**
 * Destructive tools require the caller to echo the target's name, so a mistaken or hallucinated ID cannot delete the
 * wrong workspace, project or membership. The expected value is never revealed in the error.
 */
const requireConfirmation = (
  overview: WorkspaceOverview,
  workspaceId: string,
  confirm: string,
  expected: (workspace: WorkspaceOverview['workspaces'][number]) => string | undefined,
  target: string,
) => {
  const workspace = overview.workspaces.find((item) => item.id === workspaceId);
  if (!workspace)
    return Effect.fail(new McpToolError({ message: 'You do not have access to this workspace or project.' }));
  const value = expected(workspace);
  if (value === undefined) return Effect.fail(new McpToolError({ message: `The ${target} was not found.` }));
  if (normalize(value) !== normalize(confirm))
    return Effect.fail(
      new McpToolError({
        message: `confirm does not match the ${target}. Check the target with get_workspaces and confirm with the user.`,
      }),
    );
  return Effect.void;
};

const confirmation = (input: WorkspaceAction & { readonly confirm?: string }) => {
  const confirm = input.confirm ?? '';
  switch (input.action) {
    case 'deleteWorkspace':
    case 'leaveWorkspace':
      return (overview: WorkspaceOverview) =>
        requireConfirmation(overview, input.workspaceId, confirm, (w) => w.name, 'workspace name');
    case 'deleteProject':
      return (overview: WorkspaceOverview) =>
        requireConfirmation(
          overview,
          input.workspaceId,
          confirm,
          (w) => w.projects.find((p) => p.id === input.projectId)?.name,
          'project name',
        );
    case 'removeMember':
    case 'revokeProjectAccess':
      return (overview: WorkspaceOverview) =>
        requireConfirmation(
          overview,
          input.workspaceId,
          confirm,
          (w) => w.members.find((m) => m.accountId === input.accountId)?.email,
          "member's email address",
        );
    case 'revokeInvitation':
      return (overview: WorkspaceOverview) =>
        requireConfirmation(
          overview,
          input.workspaceId,
          confirm,
          (w) => w.invitations.find((i) => i.id === input.invitationId)?.email,
          'invited email address',
        );
    default:
      return undefined;
  }
};

const decodeAction = Schema.decodeUnknownEffect(WorkspaceActionSchema);

export const WorkspaceMcpToolsLive = WorkspaceMcpToolkit.toLayer(
  Effect.gen(function* () {
    const services = yield* Effect.context<WorkspaceStore>();
    const run = (input: Record<string, unknown> & { readonly action: WorkspaceAction['action'] }) =>
      Effect.gen(function* () {
        const client = yield* currentMcpClient;
        yield* Effect.annotateCurrentSpan({
          'workspace.action': input.action,
          'mcp.client_id': client.clientId,
          'mcp.client_name': client.clientName,
        });
        const { confirm, ...fields } = input;
        const decoded = yield* decodeAction(fields).pipe(
          Effect.mapError(
            (error) => new McpToolError({ message: `Invalid ${input.action} request: ${error.message}` }),
          ),
        );
        const check = confirmation({ ...decoded, confirm: typeof confirm === 'string' ? confirm : undefined });
        if (check) yield* Effect.flatMap(loadWorkspaceOverview(client.account).pipe(Effect.mapError(toolError)), check);
        return yield* executeWorkspaceAction(client.account, decoded).pipe(Effect.mapError(toolError));
      }).pipe(Effect.withSpan(`mcp.workspace.${input.action}`), Effect.provide(services));

    return WorkspaceMcpToolkit.of({
      get_workspaces: () =>
        Effect.gen(function* () {
          const client = yield* currentMcpClient;
          return yield* loadWorkspaceOverview(client.account).pipe(Effect.mapError(toolError));
        }).pipe(Effect.provide(services)),
      create_workspace: (p) => run({ action: 'createWorkspace', ...p }),
      rename_workspace: (p) => run({ action: 'renameWorkspace', ...p }),
      set_workspace_logo: (p) => run({ action: 'setWorkspaceLogo', ...p }),
      delete_workspace: (p) => run({ action: 'deleteWorkspace', ...p }),
      invite_member: (p) => run({ action: 'inviteMember', ...p }),
      revoke_invitation: (p) => run({ action: 'revokeInvitation', ...p }),
      accept_invitation: (p) => run({ action: 'acceptInvitation', ...p }),
      decline_invitation: (p) => run({ action: 'declineInvitation', ...p }),
      set_member_role: (p) => run({ action: 'setRole', ...p }),
      remove_member: (p) => run({ action: 'removeMember', ...p }),
      leave_workspace: (p) => run({ action: 'leaveWorkspace', ...p }),
      create_project: (p) => run({ action: 'createProject', ...p }),
      rename_project: (p) => run({ action: 'renameProject', ...p }),
      delete_project: (p) => run({ action: 'deleteProject', ...p }),
      grant_project_access: (p) => run({ action: 'grantProjectAccess', ...p }),
      revoke_project_access: (p) => run({ action: 'revokeProjectAccess', ...p }),
    });
  }),
);

/** Workspace, membership and project management tools. Requires `WorkspaceStore`. */
export const WorkspaceMcpLive = McpServer.toolkit(WorkspaceMcpToolkit).pipe(Layer.provide(WorkspaceMcpToolsLive));
