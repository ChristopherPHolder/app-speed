import { Schema } from 'effect';
import {
  UserflowRunnerStepSchema,
  UserflowEndNavigationStepSchema,
  UserflowEndTimespanStepSchema,
  UserflowSnapshotStepSchema,
  UserflowStartNavigationStepSchema,
  UserflowStartTimespanStepSchema,
  UserflowStepSchema,
} from './lighthouse-userflow/lighthouse-userflow-step';
import {
  ChangeStepSchema,
  ClickStepSchema,
  CloseStepSchema,
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
} from './puppeteer-replay/puppeteer-replay-step';
import { DeviceSchema } from './shared/device-type';

const AuthoringPuppeteerReplaySteps = [
  ChangeStepSchema,
  ClickStepSchema,
  CloseStepSchema,
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

export const AuditAuthoringStepSchema = Schema.Union(
  ...AuthoringPuppeteerReplaySteps,
  UserflowStartNavigationStepSchema,
  UserflowEndNavigationStepSchema,
  UserflowStartTimespanStepSchema,
  UserflowEndTimespanStepSchema,
  UserflowSnapshotStepSchema,
).annotations({
  title: 'AuditAuthoringStep',
});

const RunnerStepSchema = Schema.Union(...AuthoringPuppeteerReplaySteps, UserflowRunnerStepSchema);

export type AuditStep = typeof AuditAuthoringStepSchema.Type;
const AuditStepsSchema = Schema.NonEmptyArray(AuditAuthoringStepSchema);
const RunnerStepsSchema = Schema.NonEmptyArray(RunnerStepSchema);

const RequiresAuditStepSchemaFilter = Schema.filter<typeof AuditStepsSchema>(
  (steps) => !!steps.filter((step) => Schema.is(UserflowStepSchema)(step)).length || 'Requires at least one audit steps',
);

const NonNegativeIntFromStringSchema = Schema.NumberFromString.pipe(Schema.int(), Schema.nonNegative()).annotations({
  identifier: 'NonNegativeIntFromString',
});

const TimeoutSchema = Schema.optional(
  Schema.Union(Schema.NonNegativeInt, NonNegativeIntFromStringSchema).annotations({
    identifier: 'Timeout',
  }),
);

export const AuditAuthoringSchema = Schema.Struct({
  title: Schema.NonEmptyString,
  device: DeviceSchema,
  timeout: TimeoutSchema,
  steps: Schema.NonEmptyArray(AuditAuthoringStepSchema)
    .pipe(RequiresAuditStepSchemaFilter)
    .annotations({ title: 'AuditSteps' }),
}).annotations({ title: 'AuditAuthoring' });

export type AuditAuthoring = typeof AuditAuthoringSchema.Type;

/**
 * The Puppeteer Replay Userflow Runner Schema parseble and executable by puppeteer replay when decoded.
 */
export const PuppeteerReplayUserflowRunnerSchema = Schema.Struct({
  ...AuditAuthoringSchema.fields,
  steps: RunnerStepsSchema.annotations({ title: 'RunnerSteps' }),
});
