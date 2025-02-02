import { Schema } from 'effect';
import { DEVICE_TYPE } from '@app-speed/shared-user-flow-replay';
import { UserflowAuditStepSchema, UserflowAuditStepTypeScheme } from './userflow-step';
import { PuppeteerReplayStepSchema } from './puppeteer-replay-step';
import { StepType } from '@puppeteer/replay';

const DeviceSchema = Schema.Literal(DEVICE_TYPE.MOBILE, DEVICE_TYPE.TABLET, DEVICE_TYPE.DESKTOP);

const AuditStepSchema = Schema.Union(PuppeteerReplayStepSchema, UserflowAuditStepSchema);
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
  steps: AuditStepsSchema.pipe(RequiresAuditStepSchemaFilter),
});

export type ReplayUserflowAudit = typeof ReplayUserflowAuditSchema.Type;
