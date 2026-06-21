import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { type Audit } from '@app-speed/audit/domain';

export const auditStatusValues = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETE'] as const;
export type AuditStatus = (typeof auditStatusValues)[number];
export const auditStatusEnum = pgEnum('audit_status', auditStatusValues);

export const auditResultStatusValues = ['SUCCESS', 'FAILURE'] as const;
export type AuditResultStatus = (typeof auditResultStatusValues)[number];
export const auditResultStatusEnum = pgEnum('audit_result_status', auditResultStatusValues);

export const auditTemplateTable = pgTable('audit_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  data: jsonb('data').$type<Audit>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditRunTable = pgTable(
  'audit_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    templateId: uuid('template_id')
      .notNull()
      .references(() => auditTemplateTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
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
    dataRecordKey: text('data_record_key'),
    error: jsonb('error').$type<unknown>(),
    reportHtmlRecordKey: text('report_html_record_key'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('audit_results_run_id_key').on(table.runId)],
);

export const schema = {
  auditTemplate: auditTemplateTable,
  auditRun: auditRunTable,
  auditResult: auditResultTable,
};
