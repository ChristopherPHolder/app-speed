import {
  PUPPETEER_REPLAY_ASSERTION_STEP_TYPE,
  PUPPETEER_REPLAY_USER_STEP_TYPE,
} from './puppeteer-replay/puppeteer-replay-step-type';
import { LIGHTHOUSE_AUDIT_STEP_TYPE } from './lighthouse-userflow/lighthouse-userflow-step-type';

export const STEP_TYPE = {
  EMPTY: '', // TODO This should not be here as it is also used in the property options
  ...LIGHTHOUSE_AUDIT_STEP_TYPE,
  ...PUPPETEER_REPLAY_ASSERTION_STEP_TYPE,
  ...PUPPETEER_REPLAY_USER_STEP_TYPE,
} as const;
export type StepType = (typeof STEP_TYPE)[keyof typeof STEP_TYPE];

export const STEP_TYPE_OPTIONS_GROUPED = [
  {
    label: 'Audit Steps',
    icon: 'lighthouse-badge',
    options: Object.values(LIGHTHOUSE_AUDIT_STEP_TYPE),
  },
  {
    label: 'Assertion Steps',
    icon: 'puppeteer-badge',
    options: Object.values(PUPPETEER_REPLAY_ASSERTION_STEP_TYPE),
  },
  {
    label: 'Action Steps',
    icon: 'puppeteer-badge',
    options: Object.values(PUPPETEER_REPLAY_USER_STEP_TYPE),
  },
] as const;
