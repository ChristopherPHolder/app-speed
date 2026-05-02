import {
  PUPPETEER_REPLAY_ASSERTION_STEP_TYPE,
  PUPPETEER_REPLAY_USER_STEP_TYPE,
} from './puppeteer-replay/puppeteer-replay-step-type';
import { LIGHTHOUSE_AUDIT_STEP_TYPE } from './lighthouse-userflow/lighthouse-userflow-step-type';

export const STEP_TYPE = {
  ...LIGHTHOUSE_AUDIT_STEP_TYPE,
  ...PUPPETEER_REPLAY_ASSERTION_STEP_TYPE,
  ...PUPPETEER_REPLAY_USER_STEP_TYPE,
} as const;
export type StepType = (typeof STEP_TYPE)[keyof typeof STEP_TYPE];
