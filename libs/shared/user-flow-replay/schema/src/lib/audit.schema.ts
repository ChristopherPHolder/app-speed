import { Schema } from 'effect';
import { DeviceSchema } from '@app-speed/shared-user-flow-replay';
import { isUserflowStep, UserflowStepSchema } from './userflow-step';
import { PuppeteerReplayStepSchema } from './puppeteer-replay-step';

export const AuditStepSchema = Schema.Union(PuppeteerReplayStepSchema, UserflowStepSchema);

export type AuditStep = typeof AuditStepSchema.Type;
const AuditStepsSchema = Schema.NonEmptyArray(AuditStepSchema);

const RequiresAuditStepSchemaFilter = Schema.filter<typeof AuditStepsSchema>(
  (steps) => !!steps.filter((step) => isUserflowStep(step)).length || 'Requires at least one audit steps',
);

export const ReplayUserflowAuditSchema = Schema.Struct({
  title: Schema.NonEmptyString,
  device: DeviceSchema,
  timeout: Schema.optional(Schema.NonNegativeInt),
  steps: Schema.NonEmptyArray(AuditStepSchema).pipe(RequiresAuditStepSchemaFilter),
});

export type ReplayUserflowAudit = typeof ReplayUserflowAuditSchema.Type;
