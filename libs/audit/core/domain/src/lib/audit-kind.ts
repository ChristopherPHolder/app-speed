import { Schema } from 'effect';

export const AuditKindSchema = Schema.NonEmptyString.pipe(Schema.brand('AuditKind'));
export type AuditKind = typeof AuditKindSchema.Type;
