import {
  foreignKey,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const accountTable = pgTable('accounts', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  imageUrl: text('image_url').notNull(),
}).enableRLS();
export const workspaceTable = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  logo: text('logo'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();
export const workspaceMemberTable = pgTable(
  'workspace_members',
  {
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    accountId: text('account_id')
      .notNull()
      .references(() => accountTable.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['admin', 'member'] }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.workspaceId, table.accountId] }),
    index('workspace_members_account_idx').on(table.accountId),
  ],
).enableRLS();
export const projectTable = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
  },
  (table) => [unique('projects_workspace_id_id_key').on(table.workspaceId, table.id)],
).enableRLS();
export const projectMemberTable = pgTable(
  'project_members',
  {
    workspaceId: uuid('workspace_id').notNull(),
    projectId: uuid('project_id').notNull(),
    accountId: text('account_id').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.accountId] }),
    foreignKey({
      columns: [table.workspaceId, table.projectId],
      foreignColumns: [projectTable.workspaceId, projectTable.id],
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.workspaceId, table.accountId],
      foreignColumns: [workspaceMemberTable.workspaceId, workspaceMemberTable.accountId],
    }).onDelete('cascade'),
  ],
).enableRLS();
export const workspaceInvitationTable = pgTable(
  'workspace_invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role', { enum: ['admin', 'member'] }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex('workspace_invitations_workspace_email_key').on(table.workspaceId, table.email),
    index('workspace_invitations_email_idx').on(table.email),
  ],
).enableRLS();

export const workspaceSchema = {
  accounts: accountTable,
  workspaces: workspaceTable,
  workspaceMembers: workspaceMemberTable,
  projects: projectTable,
  projectMembers: projectMemberTable,
  workspaceInvitations: workspaceInvitationTable,
};
