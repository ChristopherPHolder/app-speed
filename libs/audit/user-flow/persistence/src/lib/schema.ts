import { jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import type { UserFlowAuditDefinition } from '@app-speed/audit/user-flow/domain';
// Drizzle Kit evaluates feature schemas without Nx's TypeScript path resolver.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { auditResultTable, auditTemplateTable } from '../../../../core/persistence/src/lib/schema';

export const userFlowAuditTemplateTable = pgTable('user_flow_audit_templates', {
  templateId: uuid('template_id')
    .primaryKey()
    .references(() => auditTemplateTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  definition: jsonb('definition').$type<UserFlowAuditDefinition>().notNull(),
});

export const userFlowAuditResultTable = pgTable('user_flow_audit_results', {
  resultId: uuid('result_id')
    .primaryKey()
    .references(() => auditResultTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  flowResultRecordKey: text('flow_result_record_key').notNull(),
  reportHtmlRecordKey: text('report_html_record_key').notNull(),
});

export const userFlowAuditSchema = {
  userFlowAuditTemplates: userFlowAuditTemplateTable,
  userFlowAuditResults: userFlowAuditResultTable,
};
