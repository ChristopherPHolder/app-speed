import { jsonb, pgTable, uuid } from 'drizzle-orm/pg-core';

import type { UserFlowAuditDefinition } from '@app-speed/audit/user-flow/domain';
// Drizzle Kit evaluates feature schemas without Nx's TypeScript path resolver.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { auditTemplateTable } from '../../../../core/persistence/src/lib/schema';

export const userFlowAuditTemplateTable = pgTable('user_flow_audit_templates', {
  templateId: uuid('template_id')
    .primaryKey()
    .references(() => auditTemplateTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  definition: jsonb('definition').$type<UserFlowAuditDefinition>().notNull(),
});

export const userFlowAuditSchema = {
  userFlowAuditTemplates: userFlowAuditTemplateTable,
};
