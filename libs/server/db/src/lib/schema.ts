import { randomUUID } from 'node:crypto';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { type ReplayUserflowAudit } from '@app-speed/shared-user-flow-replay/schema';

export const auditStatusValues = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETE'] as const;
export type AuditStatus = (typeof auditStatusValues)[number];

export const auditResultStatusValues = ['SUCCESS', 'FAILURE'] as const;
export type AuditResultStatus = (typeof auditResultStatusValues)[number];

export const auditTemplateTable = sqliteTable(
  'AuditTemplate',
  {
    id: text('id').primaryKey().$defaultFn(randomUUID),
    data: text('data', { mode: 'json' }).$type<ReplayUserflowAudit>().notNull(),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex('AuditTemplate_id_key').on(table.id)],
);

export const auditRunTable = sqliteTable(
  'AuditRun',
  {
    id: text('id').primaryKey().$defaultFn(randomUUID),
    templateId: text('templateId')
      .notNull()
      .references(() => auditTemplateTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    status: text('status', { enum: auditStatusValues }).$type<AuditStatus>().notNull().default('SCHEDULED'),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    startedAt: integer('startedAt', { mode: 'timestamp_ms' }),
    completedAt: integer('completedAt', { mode: 'timestamp_ms' }),
    durationMs: integer('durationMs'),
  },
  (table) => [uniqueIndex('AuditRun_id_key').on(table.id)],
);

export const auditResultTable = sqliteTable(
  'AuditResult',
  {
    id: text('id').primaryKey().$defaultFn(randomUUID),
    runId: text('runId')
      .notNull()
      .references(() => auditRunTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    status: text('status', { enum: auditResultStatusValues }).$type<AuditResultStatus>().notNull(),
    data: text('data', { mode: 'json' }).$type<unknown>(),
    error: text('error', { mode: 'json' }).$type<unknown>(),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex('AuditResult_runId_key').on(table.runId)],
);

export const schema = {
  auditTemplate: auditTemplateTable,
  auditRun: auditRunTable,
  auditResult: auditResultTable,
};
