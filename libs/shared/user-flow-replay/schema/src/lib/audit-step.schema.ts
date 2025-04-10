import { Schema } from 'effect';
import { LIGHTHOUSE_AUDIT_STEP_TYPE } from '@app-speed/shared-user-flow-replay';
import { StepType } from '@puppeteer/replay';

const PuppeteerReplayStepTypeSchema = Schema.Literal(
  StepType.Change,
  StepType.Click,
  StepType.Close,
  StepType.CustomStep,
  StepType.DoubleClick,
  StepType.EmulateNetworkConditions,
  StepType.Hover,
  StepType.KeyDown,
  StepType.KeyUp,
  StepType.Navigate,
  StepType.Scroll,
  StepType.SetViewport,
  StepType.WaitForElement,
  StepType.WaitForExpression,
);

const LighthouseUserflowStepTypeSchema = Schema.Literal(
  LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
  LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
  LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN,
  LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN,
  LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT,
);

export const AuditStepTypeSchema = Schema.Union(
  PuppeteerReplayStepTypeSchema,
  LighthouseUserflowStepTypeSchema,
).annotations({
  identifier: 'AuditStepType',
  parseIssueTitle: ({ actual }) => `Invalid audit step type: ${actual || null} is not supported`,
  message: ({ actual }) => `Invalid audit step type: ${actual ?? null} is not supported`,
});

export const isStepType = Schema.is(AuditStepTypeSchema);

export const AuditStepSchema = Schema.Struct({
  type: AuditStepTypeSchema,
});

export const isAuditStep = Schema.is(AuditStepSchema);
