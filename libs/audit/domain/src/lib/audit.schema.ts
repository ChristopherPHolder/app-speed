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
import { AuditAddCookieStepSchema, AuditClearCacheStepSchema, AuditCustomRunnerStepSchema } from './custom-audit-step';
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

const AuditPuppeteerReplaySteps = [
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

export const AuditStepSchema = Schema.Union(
  ...AuditPuppeteerReplaySteps,
  UserflowStartNavigationStepSchema,
  UserflowEndNavigationStepSchema,
  UserflowStartTimespanStepSchema,
  UserflowEndTimespanStepSchema,
  UserflowSnapshotStepSchema,
  AuditClearCacheStepSchema,
  AuditAddCookieStepSchema,
).annotations({
  title: 'AuditStep',
});

const RunnerStepSchema = Schema.Union(...AuditPuppeteerReplaySteps, UserflowRunnerStepSchema, AuditCustomRunnerStepSchema);

export type AuditStep = typeof AuditStepSchema.Type;
const AuditStepsSchema = Schema.NonEmptyArray(AuditStepSchema);
const RunnerStepsSchema = Schema.NonEmptyArray(RunnerStepSchema);

const RequiresAuditStepSchemaFilter = Schema.filter<typeof AuditStepsSchema>(
  (steps) => !!steps.filter((step) => Schema.is(UserflowStepSchema)(step)).length || 'Requires at least one audit step',
);

const NonNegativeIntFromStringSchema = Schema.NumberFromString.pipe(Schema.int(), Schema.nonNegative()).annotations({
  identifier: 'NonNegativeIntFromString',
});

const TimeoutSchema = Schema.optional(
  Schema.Union(Schema.NonNegativeInt, NonNegativeIntFromStringSchema).annotations({
    identifier: 'Timeout',
  }),
);

export const AuditSchema = Schema.Struct({
  title: Schema.NonEmptyString,
  device: DeviceSchema,
  timeout: TimeoutSchema,
  steps: Schema.NonEmptyArray(AuditStepSchema)
    .pipe(RequiresAuditStepSchemaFilter)
    .annotations({ title: 'AuditSteps' }),
}).annotations({ title: 'Audit' });

export type Audit = typeof AuditSchema.Type;

/**
 * The Puppeteer Replay Userflow Runner Schema parseable and executable by puppeteer replay when decoded.
 */
export const PuppeteerReplayUserflowRunnerSchema = Schema.Struct({
  ...AuditSchema.fields,
  steps: RunnerStepsSchema.annotations({ title: 'RunnerSteps' }),
});
