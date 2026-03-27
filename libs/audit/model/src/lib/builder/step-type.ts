import { LIGHTHOUSE_AUDIT_STEP_TYPE } from '../shared/lighthouse-step-type';

// Assertion Step Types are those related to puppeteer assertion steps!
const ASSERTION_STEP_TYPE = {
  WAIT_FOR_ELEMENT: 'waitForElement',
  WAIT_FOR_EXPRESSION: 'waitForExpression',
} as const;

// User Step Types are those related to puppeteer user steps!
const USER_STEP_TYPE = {
  CHANGE: 'change',
  CLICK: 'click',
  CLOSE: 'close',
  DOUBLE_CLICK: 'doubleClick',
  EMULATE_NETWORK_CONDITIONS: 'emulateNetworkConditions',
  HOVER: 'hover',
  KEY_DOWN: 'keyDown',
  KEY_UP: 'keyUp',
  NAVIGATE: 'navigate',
  SCROLL: 'scroll',
  SET_VIEWPORT: 'setViewport',
} as const;

export const STEP_TYPE = {
  EMPTY: '', // TODO This should not be here as it is also used in the property options
  ...LIGHTHOUSE_AUDIT_STEP_TYPE,
  ...ASSERTION_STEP_TYPE,
  ...USER_STEP_TYPE,
} as const;
export type StepType = (typeof STEP_TYPE)[keyof typeof STEP_TYPE];
export const STEP_OPTIONS = Object.values(STEP_TYPE);

export const STEP_TYPE_OPTIONS_GROUPED = [
  {
    label: 'Audit Steps',
    icon: 'lighthouse-badge',
    options: Object.values(LIGHTHOUSE_AUDIT_STEP_TYPE),
  },
  {
    label: 'Assertion Steps',
    icon: 'puppeteer-badge',
    options: Object.values(ASSERTION_STEP_TYPE),
  },
  {
    label: 'Action Steps',
    icon: 'puppeteer-badge',
    options: Object.values(USER_STEP_TYPE),
  },
] as const;
