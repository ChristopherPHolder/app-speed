import { Schema } from 'effect';
import {
  PUPPETEER_REPLAY_ASSERTION_STEP_TYPE,
  PUPPETEER_REPLAY_CUSTOM_STEP_TYPE,
  PUPPETEER_REPLAY_USER_STEP_TYPE,
} from './puppeteer-replay/puppeteer-replay-step-type';

const PuppeteerReplayStepTypeSchema = Schema.Literals([
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
]);

export const AuditStepTypeSchema = Schema.Literals([
  ...PuppeteerReplayStepTypeSchema.literals,
  PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
]).annotate({
  identifier: 'AuditStepType',
  message: 'Invalid audit step type',
});

export const isStepType = Schema.is(AuditStepTypeSchema);

const ReplayAuditStepSchema = Schema.Struct({ type: PuppeteerReplayStepTypeSchema });
export const AuditCustomStepBaseSchema = Schema.Struct({
  type: Schema.Literal(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP),
  step: Schema.NonEmptyString,
});

export const AuditStepSchema = Schema.Union([ReplayAuditStepSchema, AuditCustomStepBaseSchema]);

export const isAuditStep = Schema.is(AuditStepSchema);
