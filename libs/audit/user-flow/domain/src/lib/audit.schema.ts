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

export const UserFlowAuditStepSchema = Schema.Union([
  PuppeteerReplayStepSchema,
  UserflowStepSchema,
  AuditClearCacheStepSchema,
  AuditAddCookieStepSchema,
  AuditWaitForTimeStepSchema,
  AuditWaitForNetworkIdleStepSchema,
]).pipe(
  Schema.annotate({
    title: 'AuditStep',
  }),
);

const RunnerStepSchema = Schema.Union([
  UserflowRunnerStepSchema,
  AuditCustomRunnerStepSchema,
  PuppeteerReplayRunnerStepSchema,
]);

export type UserFlowAuditStep = typeof UserFlowAuditStepSchema.Type;
const RunnerStepsSchema = Schema.NonEmptyArray(RunnerStepSchema);

export const UserFlowAuditDefinitionSchema = Schema.Struct({
  ...AuditDefinitionBaseSchema.fields,
  steps: Schema.NonEmptyArray(UserFlowAuditStepSchema).pipe(
    Schema.check(
      Schema.makeFilter((steps) => steps.some(Schema.is(UserflowStepSchema)) || 'Requires at least one audit step'),
    ),
    Schema.annotate({ title: 'AuditSteps' }),
  ),
}).pipe(Schema.annotate({ title: 'Audit' }));

export type UserFlowAuditDefinition = typeof UserFlowAuditDefinitionSchema.Type;

/**
 * The Puppeteer Replay Userflow Runner Schema parseable and executable by puppeteer replay when decoded.
 */
export const PuppeteerReplayUserflowRunnerSchema = Schema.Struct({
  ...UserFlowAuditDefinitionSchema.fields,
  steps: RunnerStepsSchema.pipe(Schema.annotate({ title: 'RunnerSteps' })),
});
