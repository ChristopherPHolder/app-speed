import { Schema } from 'effect';
import { DeviceSchema } from '@app-speed/shared-user-flow-replay';
import { LighthouseUserflowStepSchema, UserflowAuditStepTypeScheme } from './userflow-step';
import { PuppeteerReplayStepSchema } from './puppeteer-replay-step';
import { StepType } from '@puppeteer/replay';

export const AuditStepSchema = Schema.Union(
  ...PuppeteerReplayStepSchema.members,
  ...LighthouseUserflowStepSchema.members,
);

export type AuditStep = typeof AuditStepSchema.Type;
const AuditStepsSchema = Schema.NonEmptyArray(AuditStepSchema);

const auditStepTypes = UserflowAuditStepTypeScheme.literals as unknown as string[];
const RequiresAuditStepSchemaFilter = Schema.filter<typeof AuditStepsSchema>(
  (steps) =>
    !!steps.filter((step) => step.type === StepType.CustomStep && auditStepTypes.includes(step.name)).length ||
    'Requires at least one audit steps',
);

export const ReplayUserflowAuditSchema = Schema.Struct({
  title: Schema.NonEmptyString,
  device: DeviceSchema,
  timeout: Schema.optional(Schema.NonNegativeInt),
  steps: AuditStepSchema,
});

export type ReplayUserflowAudit = typeof ReplayUserflowAuditSchema.Type;
