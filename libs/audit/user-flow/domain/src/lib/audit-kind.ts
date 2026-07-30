import { Schema } from 'effect';
import { AuditKindSchema } from '@app-speed/audit/core/domain';

export const USER_FLOW_AUDIT_KIND_LITERAL = 'user-flow' as const;
export const USER_FLOW_AUDIT_KIND = Schema.decodeSync(AuditKindSchema)(USER_FLOW_AUDIT_KIND_LITERAL);
export const UserFlowAuditKindSchema = Schema.Literal(USER_FLOW_AUDIT_KIND_LITERAL);
export type UserFlowAuditKind = typeof UserFlowAuditKindSchema.Type;
