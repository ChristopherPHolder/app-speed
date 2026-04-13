import { Schema } from 'effect';
import {
  LIGHTHOUSE_AUDIT_STEP_TYPE,
  PUPPETEER_REPLAY_ASSERTION_STEP_TYPE,
  PUPPETEER_REPLAY_CUSTOM_STEP_TYPE,
  PUPPETEER_REPLAY_USER_STEP_TYPE,
} from '@app-speed/audit/model';

const PuppeteerReplayStepTypeSchema = Schema.Literal(
  PUPPETEER_REPLAY_USER_STEP_TYPE.CHANGE,
  PUPPETEER_REPLAY_USER_STEP_TYPE.CLICK,
  PUPPETEER_REPLAY_USER_STEP_TYPE.CLOSE,
  PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
  PUPPETEER_REPLAY_USER_STEP_TYPE.DOUBLE_CLICK,
  PUPPETEER_REPLAY_USER_STEP_TYPE.EMULATE_NETWORK_CONDITIONS,
  PUPPETEER_REPLAY_USER_STEP_TYPE.HOVER,
  PUPPETEER_REPLAY_USER_STEP_TYPE.KEY_DOWN,
  PUPPETEER_REPLAY_USER_STEP_TYPE.KEY_UP,
  PUPPETEER_REPLAY_USER_STEP_TYPE.NAVIGATE,
  PUPPETEER_REPLAY_USER_STEP_TYPE.SCROLL,
  PUPPETEER_REPLAY_USER_STEP_TYPE.SET_VIEWPORT,
  PUPPETEER_REPLAY_ASSERTION_STEP_TYPE.WAIT_FOR_ELEMENT,
  PUPPETEER_REPLAY_ASSERTION_STEP_TYPE.WAIT_FOR_EXPRESSION,
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
