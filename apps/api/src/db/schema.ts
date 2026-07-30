// Drizzle Kit loads this composition file outside Nx's TypeScript path resolver.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { schema as coreAuditSchema } from '../../../../libs/audit/core/persistence/src/lib/schema';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { userFlowAuditSchema } from '../../../../libs/audit/user-flow/persistence/src/lib/schema';

// eslint-disable-next-line @nx/enforce-module-boundaries
export {
  auditResultTable,
  auditRunTable,
  auditStatusEnum,
  auditTemplateTable,
  auditResultStatusEnum,
} from '../../../../libs/audit/core/persistence/src/lib/schema';
// eslint-disable-next-line @nx/enforce-module-boundaries
export { userFlowAuditTemplateTable } from '../../../../libs/audit/user-flow/persistence/src/lib/schema';

export const schema = {
  ...coreAuditSchema,
  ...userFlowAuditSchema,
};
