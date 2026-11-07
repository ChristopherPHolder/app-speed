// eslint-disable-next-line @nx/enforce-module-boundaries
import { workspaceSchema } from '../../../../libs/workspace/api-runtime/src/schema';

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
export {
  userFlowAuditResultTable,
  userFlowAuditTemplateTable,
} from '../../../../libs/audit/user-flow/persistence/src/lib/schema';

export const schema = {
  ...workspaceSchema,
  ...coreAuditSchema,
  ...userFlowAuditSchema,
};

// eslint-disable-next-line @nx/enforce-module-boundaries
export {
  accountTable,
  workspaceTable,
  workspaceMemberTable,
  projectTable,
  projectMemberTable,
  workspaceInvitationTable,
} from '../../../../libs/workspace/api-runtime/src/schema';
