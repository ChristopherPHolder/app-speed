import { Schema } from 'effect';
import { AUDIT_CUSTOM_STEP_TYPE } from './custom-audit-step-type';
import { LIGHTHOUSE_AUDIT_STEP_TYPE } from './lighthouse-userflow/lighthouse-userflow-step-type';
import {
  PUPPETEER_REPLAY_ASSERTION_STEP_TYPE,
  PUPPETEER_REPLAY_CUSTOM_STEP_TYPE,
  PUPPETEER_REPLAY_USER_STEP_TYPE,
} from './puppeteer-replay/puppeteer-replay-step-type';

const PuppeteerReplayStepTypeSchema = Schema.Literal(
  PUPPETEER_REPLAY_USER_STEP_TYPE.CHANGE,
  PUPPETEER_REPLAY_USER_STEP_TYPE.CLICK,
  PUPPETEER_REPLAY_USER_STEP_TYPE.CLOSE,
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

export const LighthouseAuditStepTypeSchema = Schema.Literal(
  LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
  LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
  LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN,
  LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN,
  LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT,
);

export const AppAuditCustomStepTypeSchema = Schema.Literal(
  AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE,
  AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE,
  AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_TIME,
);

export const AuditCustomStepTypeSchema = Schema.Union(LighthouseAuditStepTypeSchema, AppAuditCustomStepTypeSchema);

export const AuditStepTypeSchema = Schema.Union(
  PuppeteerReplayStepTypeSchema,
  Schema.Literal(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP),
).annotations({
  identifier: 'AuditStepType',
  parseIssueTitle: ({ actual }) => `Invalid audit step type: ${actual || null} is not supported`,
  message: ({ actual }) => `Invalid audit step type: ${actual ?? null} is not supported`,
});

export const isStepType = Schema.is(AuditStepTypeSchema);

const ReplayAuditStepSchema = Schema.Struct({ type: PuppeteerReplayStepTypeSchema });
const CustomAuditStepSchema = Schema.Struct({
  type: AuditStepTypeSchema.pipe(Schema.pickLiteral(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)),
  step: AuditCustomStepTypeSchema,
});

export const AuditStepSchema = Schema.Union(ReplayAuditStepSchema, CustomAuditStepSchema);

export const isAuditStep = Schema.is(AuditStepSchema);
