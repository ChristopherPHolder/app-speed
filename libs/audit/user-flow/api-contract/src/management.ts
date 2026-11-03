import { Schema } from 'effect';
import { RecurrenceSchema } from '@app-speed/audit/core/domain';
import { UserFlowAuditDefinitionSchema } from '@app-speed/audit/user-flow/domain';
const id = Schema.String.check(Schema.isUUID());
export const AuditManagementCommandSchema = Schema.Union([
  Schema.Struct({ action: Schema.Literal('list') }),
  Schema.Struct({
    action: Schema.Literal('save'),
    templateId: Schema.optional(id),
    definition: UserFlowAuditDefinitionSchema,
  }),
  Schema.Struct({ action: Schema.Literal('deleteAudit'), templateId: id }),
  Schema.Struct({ action: Schema.Literal('run'), versionId: id }),
  Schema.Struct({ action: Schema.Literal('claim'), runId: id, claimToken: Schema.String }),
  Schema.Struct({ action: Schema.Literal('share'), runId: id }),
  Schema.Struct({ action: Schema.Literal('revokeShare'), shareId: id }),
  Schema.Struct({ action: Schema.Literal('createSchedule'), versionId: id, recurrence: RecurrenceSchema }),
  Schema.Struct({
    action: Schema.Literal('updateSchedule'),
    scheduleId: id,
    versionId: Schema.optional(id),
    recurrence: Schema.optional(RecurrenceSchema),
    state: Schema.optional(Schema.Literals(['active', 'paused', 'deleted'])),
    createdBy: Schema.optional(Schema.String),
  }),
  Schema.Struct({ action: Schema.Literal('occurrences'), scheduleId: id }),
]);
export type AuditManagementCommand = typeof AuditManagementCommandSchema.Type;

export const ManagementOverviewSchema = Schema.Struct({
  space: Schema.Struct({
    id: Schema.String,
    kind: Schema.Literals(['personal', 'organization']),
    role: Schema.Literals(['admin', 'member']),
    userId: Schema.String,
  }),
  limit: Schema.Number,
  templates: Schema.Array(
    Schema.Struct({ id: Schema.String, title: Schema.String, createdBy: Schema.NullOr(Schema.String) }),
  ),
  versions: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      templateId: Schema.String,
      definition: UserFlowAuditDefinitionSchema,
      createdAt: Schema.String,
    }),
  ),
  schedules: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      templateId: Schema.String,
      versionId: Schema.String,
      createdBy: Schema.String,
      recurrence: RecurrenceSchema,
      state: Schema.Literals(['active', 'paused', 'deleted']),
      nextDueAt: Schema.String,
    }),
  ),
  shares: Schema.Array(
    Schema.Struct({ id: Schema.String, runId: Schema.String, revokedAt: Schema.NullOr(Schema.String) }),
  ),
});
export const OccurrenceHistorySchema = Schema.Array(
  Schema.Struct({
    occurrence: Schema.Struct({
      id: Schema.String,
      dueAt: Schema.String,
      count: Schema.Number,
      outcome: Schema.Literals(['dispatched', 'overlap', 'missed']),
      runId: Schema.NullOr(Schema.String),
      versionId: Schema.String,
    }),
    runStatus: Schema.NullOr(Schema.String),
    resultStatus: Schema.NullOr(Schema.String),
    error: Schema.Unknown,
  }),
);
