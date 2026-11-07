import { Schema } from 'effect';

export const WorkspaceRole = Schema.Literals(['admin', 'member']);
const Id = Schema.String.check(Schema.isPattern(/^[a-zA-Z0-9_-]{1,128}$/));
const EntityId = Schema.String.check(
  Schema.isPattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
);
const Name = Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(100), Schema.isPattern(/\S/));
const Email = Schema.String.check(Schema.isMaxLength(254), Schema.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/));

// The portal normalizes logos to a 128×128 PNG. The prefix includes its PNG signature and IHDR dimensions.
export const workspaceLogoSize = 128;
export const WorkspaceLogoSchema = Schema.String.check(
  Schema.isMaxLength(96 * 1024),
  Schema.isPattern(/^data:image\/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACA[A-Za-z0-9+/]+={0,2}$/),
);

export const AccountSchema = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  name: Schema.String,
  imageUrl: Schema.String,
});
export const MemberSchema = Schema.Struct({
  accountId: Schema.String,
  email: Schema.String,
  name: Schema.String,
  role: WorkspaceRole,
});
export const ProjectSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  memberIds: Schema.Array(Schema.String),
});
export const InvitationSchema = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  role: WorkspaceRole,
  expiresAt: Schema.String,
});
export const WorkspaceSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  role: WorkspaceRole,
  logo: Schema.NullOr(WorkspaceLogoSchema),
  members: Schema.Array(MemberSchema),
  projects: Schema.Array(ProjectSchema),
  invitations: Schema.Array(InvitationSchema),
});
export const WorkspaceOverviewSchema = Schema.Struct({
  account: AccountSchema,
  workspaces: Schema.Array(WorkspaceSchema),
  invitations: Schema.Array(
    Schema.Struct({ id: Schema.String, workspaceName: Schema.String, role: WorkspaceRole, expiresAt: Schema.String }),
  ),
});

export const WorkspaceActionSchema = Schema.Union([
  Schema.Struct({ action: Schema.Literal('createWorkspace'), name: Name }),
  Schema.Struct({ action: Schema.Literal('renameWorkspace'), workspaceId: EntityId, name: Name }),
  Schema.Struct({
    action: Schema.Literal('setWorkspaceLogo'),
    workspaceId: EntityId,
    logo: Schema.NullOr(WorkspaceLogoSchema),
  }),
  Schema.Struct({ action: Schema.Literal('deleteWorkspace'), workspaceId: EntityId }),
  Schema.Struct({ action: Schema.Literal('inviteMember'), workspaceId: EntityId, email: Email, role: WorkspaceRole }),
  Schema.Struct({ action: Schema.Literal('revokeInvitation'), workspaceId: EntityId, invitationId: EntityId }),
  Schema.Struct({ action: Schema.Literal('acceptInvitation'), invitationId: EntityId }),
  Schema.Struct({ action: Schema.Literal('declineInvitation'), invitationId: EntityId }),
  Schema.Struct({ action: Schema.Literal('setRole'), workspaceId: EntityId, accountId: Id, role: WorkspaceRole }),
  Schema.Struct({ action: Schema.Literal('removeMember'), workspaceId: EntityId, accountId: Id }),
  Schema.Struct({ action: Schema.Literal('leaveWorkspace'), workspaceId: EntityId }),
  Schema.Struct({ action: Schema.Literal('createProject'), workspaceId: EntityId, name: Name }),
  Schema.Struct({ action: Schema.Literal('renameProject'), workspaceId: EntityId, projectId: EntityId, name: Name }),
  Schema.Struct({ action: Schema.Literal('deleteProject'), workspaceId: EntityId, projectId: EntityId }),
  Schema.Struct({
    action: Schema.Literal('grantProjectAccess'),
    workspaceId: EntityId,
    projectId: EntityId,
    accountId: Id,
  }),
  Schema.Struct({
    action: Schema.Literal('revokeProjectAccess'),
    workspaceId: EntityId,
    projectId: EntityId,
    accountId: Id,
  }),
]);

export type WorkspaceOverview = typeof WorkspaceOverviewSchema.Type;
export type WorkspaceAction = typeof WorkspaceActionSchema.Type;
export type Workspace = typeof WorkspaceSchema.Type;

export class WorkspaceForbidden extends Schema.TaggedError<WorkspaceForbidden>()(
  'WorkspaceForbidden',
  { message: Schema.String },
  { httpApiStatus: 403 },
) {}
export class WorkspaceConflict extends Schema.TaggedError<WorkspaceConflict>()(
  'WorkspaceConflict',
  { message: Schema.String },
  { httpApiStatus: 409 },
) {}
export class WorkspaceUnavailable extends Schema.TaggedError<WorkspaceUnavailable>()(
  'WorkspaceUnavailable',
  { message: Schema.String },
  { httpApiStatus: 503 },
) {}
