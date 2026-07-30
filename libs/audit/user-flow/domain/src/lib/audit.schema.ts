import { Schema } from 'effect';
import {
  AuditAddCookieStepSchema,
  AuditClearCacheStepSchema,
  AuditCustomRunnerStepSchema,
  AuditDefinitionBaseSchema,
  AuditWaitForNetworkIdleStepSchema,
  AuditWaitForTimeStepSchema,
  PuppeteerReplayRunnerStepSchema,
  PuppeteerReplayStepSchema,
} from '@app-speed/audit/core/domain';

import { UserflowRunnerStepSchema, UserflowStepSchema } from './lighthouse-userflow/lighthouse-userflow-step';

export const UserFlowAuditStepSchema = Schema.Union(
  PuppeteerReplayStepSchema,
  UserflowStepSchema,
  AuditClearCacheStepSchema,
  AuditAddCookieStepSchema,
  AuditWaitForTimeStepSchema,
  AuditWaitForNetworkIdleStepSchema,
).annotations({
  title: 'AuditStep',
});

const RunnerStepSchema = Schema.Union(
  UserflowRunnerStepSchema,
  AuditCustomRunnerStepSchema,
  PuppeteerReplayRunnerStepSchema,
);

export type UserFlowAuditStep = typeof UserFlowAuditStepSchema.Type;
const RunnerStepsSchema = Schema.NonEmptyArray(RunnerStepSchema);

export const UserFlowAuditDefinitionSchema = Schema.Struct({
  ...AuditDefinitionBaseSchema.fields,
  steps: Schema.NonEmptyArray(UserFlowAuditStepSchema)
    .pipe(
      Schema.filter(
        (steps) =>
          !!steps.filter((step) => Schema.is(UserflowStepSchema)(step)).length || 'Requires at least one audit step',
      ),
    )
    .annotations({ title: 'AuditSteps' }),
}).annotations({ title: 'Audit' });

export type UserFlowAuditDefinition = typeof UserFlowAuditDefinitionSchema.Type;

/**
 * The Puppeteer Replay Userflow Runner Schema parseable and executable by puppeteer replay when decoded.
 */
export const PuppeteerReplayUserflowRunnerSchema = Schema.Struct({
  ...UserFlowAuditDefinitionSchema.fields,
  steps: RunnerStepsSchema.annotations({ title: 'RunnerSteps' }),
});
