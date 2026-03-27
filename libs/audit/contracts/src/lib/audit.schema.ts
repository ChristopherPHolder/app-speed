import { Schema } from 'effect';
import { DeviceSchema } from '@app-speed/audit/model';
import {
  isUserflowStep,
  UserflowEndNavigationStepSchema,
  UserflowEndTimespanStepSchema,
  UserflowSnapshotStepSchema,
  UserflowStartNavigationStepSchema,
  UserflowStartTimespanStepSchema,
  UserflowAuditStepSchema,
} from './userflow-step';
import {
  ChangeStepSchema,
  ClickStepSchema,
  CloseStepSchema,
  CustomStepWithFrameSchema,
  CustomStepWithTargetSchema,
  DoubleClickStepSchema,
  EmulateNetworkConditionsStepSchema,
  HoverStepSchema,
  KeyDownStepSchema,
  KeyUpStepSchema,
  NavigateStepSchema,
  ScrollStepSchema,
  SetViewStepSchema,
  WaitForElementStepSchema,
  WaitForExpressionStepSchema,
} from './puppeteer-replay-step';

const PuppeteerReplaySteps = [
  ChangeStepSchema,
  ClickStepSchema,
  CloseStepSchema,
  CustomStepWithTargetSchema,
  CustomStepWithFrameSchema,
  DoubleClickStepSchema,
  EmulateNetworkConditionsStepSchema,
  HoverStepSchema,
  KeyDownStepSchema,
  KeyUpStepSchema,
  NavigateStepSchema,
  ScrollStepSchema,
  SetViewStepSchema,
  WaitForElementStepSchema,
  WaitForExpressionStepSchema,
];

export const AuditStepSchema = Schema.Union(
  ...PuppeteerReplaySteps,
  // UserFlow
  UserflowStartNavigationStepSchema,
  UserflowEndNavigationStepSchema,
  UserflowStartTimespanStepSchema,
  UserflowEndTimespanStepSchema,
  UserflowSnapshotStepSchema,
).annotations({
  title: 'AuditStep',
});

const RunnerStepSchema = Schema.Union(UserflowAuditStepSchema, AuditStepSchema);

export type AuditStep = typeof AuditStepSchema.Type;
const AuditStepsSchema = Schema.NonEmptyArray(AuditStepSchema);
const RunnerStepsSchema = Schema.NonEmptyArray(RunnerStepSchema);

const RequiresAuditStepSchemaFilter = Schema.filter<typeof AuditStepsSchema>(
  (steps) => !!steps.filter((step) => isUserflowStep(step)).length || 'Requires at least one audit steps',
);

const NonNegativeIntFromStringSchema = Schema.NumberFromString.pipe(Schema.int(), Schema.nonNegative()).annotations({
  identifier: 'NonNegativeIntFromString',
});

const TimeoutSchema = Schema.optional(
  Schema.Union(Schema.NonNegativeInt, NonNegativeIntFromStringSchema).annotations({
    identifier: 'Timeout',
  }),
);

export const ReplayUserflowAuditSchema = Schema.Struct({
  title: Schema.NonEmptyString,
  device: DeviceSchema,
  timeout: TimeoutSchema,
  steps: Schema.NonEmptyArray(AuditStepSchema).pipe(RequiresAuditStepSchemaFilter).annotations({ title: 'AuditSteps' }),
}).annotations({ title: 'ReplayUserflowAudit' });

export type ReplayUserflowAudit = typeof ReplayUserflowAuditSchema.Type;

/**
 * The Puppeteer Replay Userflow Runner Schema parseble and executable by puppeteer replay when decoded.
 */
export const PuppeteerReplayUserflowRunnerSchema = Schema.Struct({
  ...ReplayUserflowAuditSchema.fields,
  steps: RunnerStepsSchema.annotations({ title: 'RunnerSteps' }),
});
