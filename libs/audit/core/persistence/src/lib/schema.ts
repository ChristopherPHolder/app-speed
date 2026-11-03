import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { Recurrence } from '@app-speed/audit/core/domain';
import type { AuditKind } from '@app-speed/audit/core/domain';

export const auditStatusValues = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETE'] as const;
export type AuditStatus = (typeof auditStatusValues)[number];
export const auditStatusEnum = pgEnum('audit_status', auditStatusValues);

export const auditResultStatusValues = ['SUCCESS', 'FAILURE'] as const;
export type AuditResultStatus = (typeof auditResultStatusValues)[number];
export const auditResultStatusEnum = pgEnum('audit_result_status', auditResultStatusValues);

export const auditSpaceTable = pgTable('audit_spaces', {
  id: text('id').primaryKey(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const auditTemplateTable = pgTable('audit_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: text('kind').$type<AuditKind>().notNull(),
  title: text('title').notNull(),
  spaceId: text('space_id').references(() => auditSpaceTable.id),
  createdBy: text('created_by'),
  guestBrowserHash: text('guest_browser_hash'),
  claimHash: text('claim_hash'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditVersionTable = pgTable('audit_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id')
    .notNull()
    .references(() => auditTemplateTable.id, { onDelete: 'restrict' }),
  definition: jsonb('definition').$type<unknown>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditScheduleTable = pgTable(
  'audit_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    spaceId: text('space_id')
      .notNull()
      .references(() => auditSpaceTable.id),
    templateId: uuid('template_id')
      .notNull()
      .references(() => auditTemplateTable.id, { onDelete: 'restrict' }),
    versionId: uuid('version_id')
      .notNull()
      .references(() => auditVersionTable.id, { onDelete: 'restrict' }),
    createdBy: text('created_by').notNull(),
    recurrence: jsonb('recurrence').$type<Recurrence>().notNull(),
    state: text('state').$type<'active' | 'paused' | 'deleted'>().notNull().default('active'),
    nextDueAt: timestamp('next_due_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('audit_schedules_due_idx').on(table.state, table.nextDueAt)],
);

export const auditRunTable = pgTable(
  'audit_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    templateId: uuid('template_id')
      .notNull()
      .references(() => auditTemplateTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    versionId: uuid('version_id').references(() => auditVersionTable.id, { onDelete: 'restrict' }),
    scheduleId: uuid('schedule_id').references(() => auditScheduleTable.id, { onDelete: 'restrict' }),
    status: auditStatusEnum('status').$type<AuditStatus>().notNull().default('SCHEDULED'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    durationMs: integer('duration_ms'),
  },
  (table) => [index('audit_runs_scheduled_queue_idx').on(table.status, table.createdAt, table.id)],
);

export const auditResultTable = pgTable(
  'audit_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    runId: uuid('run_id')
      .notNull()
      .references(() => auditRunTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    status: auditResultStatusEnum('status').$type<AuditResultStatus>().notNull(),
    error: jsonb('error').$type<unknown>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('audit_results_run_id_key').on(table.runId)],
);

export const auditOccurrenceTable = pgTable(
  'audit_occurrences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => auditScheduleTable.id, { onDelete: 'restrict' }),
    dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
    throughAt: timestamp('through_at', { withTimezone: true }),
    count: integer('count').notNull().default(1),
    outcome: text('outcome').$type<'dispatched' | 'overlap' | 'missed'>().notNull(),
    runId: uuid('run_id').references(() => auditRunTable.id),
    versionId: uuid('version_id')
      .notNull()
      .references(() => auditVersionTable.id),
  },
  (table) => [uniqueIndex('audit_occurrences_schedule_due_key').on(table.scheduleId, table.dueAt)],
);

export const auditShareTable = pgTable('audit_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id')
    .notNull()
    .references(() => auditRunTable.id),
  tokenHash: text('token_hash').notNull().unique(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});

export const schema = {
  auditSpaces: auditSpaceTable,
  auditVersions: auditVersionTable,
  auditSchedules: auditScheduleTable,
  auditOccurrences: auditOccurrenceTable,
  auditShares: auditShareTable,
  auditTemplates: auditTemplateTable,
  auditRuns: auditRunTable,
  auditResults: auditResultTable,
};
