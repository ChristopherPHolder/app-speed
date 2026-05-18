import { Schema } from 'effect';
import { UserflowRunnerStepSchema, UserflowStepSchema } from './lighthouse-userflow/lighthouse-userflow-step';
import { AuditAddCookieStepSchema, AuditClearCacheStepSchema, AuditCustomRunnerStepSchema } from './custom-audit-step';
import { PuppeteerReplayRunnerStepSchema, PuppeteerReplayStepSchema } from './puppeteer-replay/puppeteer-replay-step';
import { DeviceSchema } from './shared/device-type';

export const AuditStepSchema = Schema.Union(
  PuppeteerReplayStepSchema,
  UserflowStepSchema,
  AuditClearCacheStepSchema,
  AuditAddCookieStepSchema,
).annotations({
  title: 'AuditStep',
});

const RunnerStepSchema = Schema.Union(
  UserflowRunnerStepSchema,
  AuditCustomRunnerStepSchema,
  PuppeteerReplayRunnerStepSchema,
);

export type AuditStep = typeof AuditStepSchema.Type;
const RunnerStepsSchema = Schema.NonEmptyArray(RunnerStepSchema);

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
    .pipe(
      Schema.filter(
        (steps) =>
          !!steps.filter((step) => Schema.is(UserflowStepSchema)(step)).length || 'Requires at least one audit step',
      ),
    )
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
