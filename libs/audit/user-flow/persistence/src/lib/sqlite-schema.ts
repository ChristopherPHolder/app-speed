import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import type { UserFlowAuditDefinition } from '@app-speed/audit/user-flow/domain';
// Drizzle Kit evaluates feature schemas without Nx's TypeScript path resolver.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { auditResultTable, auditTemplateTable } from '../../../../core/persistence/src/lib/sqlite-schema';

export const userFlowAuditTemplateTable = sqliteTable('user_flow_audit_templates', {
  templateId: text('template_id')
    .primaryKey()
    .references(() => auditTemplateTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  definition: text('definition', { mode: 'json' }).$type<UserFlowAuditDefinition>().notNull(),
});

export const userFlowAuditResultTable = sqliteTable('user_flow_audit_results', {
  resultId: text('result_id')
    .primaryKey()
    .references(() => auditResultTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  flowResultRecordKey: text('flow_result_record_key').notNull(),
  reportHtmlRecordKey: text('report_html_record_key').notNull(),
});

export const userFlowAuditSchema = {
  userFlowAuditTemplates: userFlowAuditTemplateTable,
  userFlowAuditResults: userFlowAuditResultTable,
};
