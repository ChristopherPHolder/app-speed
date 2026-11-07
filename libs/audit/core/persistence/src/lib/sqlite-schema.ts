import { index, integer, text, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core';
import type { AuditKind } from '@app-speed/audit/core/domain';

export const auditStatusValues = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETE'] as const;
export type AuditStatus = (typeof auditStatusValues)[number];

export const auditResultStatusValues = ['SUCCESS', 'FAILURE'] as const;
export type AuditResultStatus = (typeof auditResultStatusValues)[number];

export const auditTemplateTable = sqliteTable('audit_templates', {
  id: text('id').primaryKey(),
  kind: text('kind').$type<AuditKind>().notNull(),
  title: text('title').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const auditRunTable = sqliteTable(
  'audit_runs',
  {
    id: text('id').primaryKey(),
    templateId: text('template_id')
      .notNull()
      .references(() => auditTemplateTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    status: text('status').$type<AuditStatus>().notNull().default('SCHEDULED'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
    durationMs: integer('duration_ms'),
  },
  (table) => [index('audit_runs_scheduled_queue_idx').on(table.status, table.createdAt, table.id)],
);

export const auditResultTable = sqliteTable(
  'audit_results',
  {
    id: text('id').primaryKey(),
    runId: text('run_id')
      .notNull()
      .references(() => auditRunTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    status: text('status').$type<AuditResultStatus>().notNull(),
    error: text('error', { mode: 'json' }).$type<unknown>(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [uniqueIndex('audit_results_run_id_key').on(table.runId)],
);

export const sqliteRecordTable = sqliteTable('records', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const schema = {
  auditTemplates: auditTemplateTable,
  auditRuns: auditRunTable,
  auditResults: auditResultTable,
  records: sqliteRecordTable,
};
