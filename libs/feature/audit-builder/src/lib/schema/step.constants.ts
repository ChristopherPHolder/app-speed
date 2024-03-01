// Audit Step Types are the ones related to running Lighthouse User-Flow Audits!
export const AUDIT_STEP_TYPE = {
  START_NAVIGATION: 'startNavigation',
  END_NAVIGATION: 'endNavigation',
  START_TIMESPAN: 'startTimespan',
  END_TIMESPAN: 'endTimespan',
  SNAPSHOT: 'snapshot',
} as const;

// Assertion Step Types are those related to puppeteer assertion steps!
export const ASSERTION_STEP_TYPE = {
  WAIT_FOR_ELEMENT: 'waitForElement',
  WAIT_FOR_EXPRESSION: 'waitForExpression'
} as const;

// User Step Types are those related to puppeteer user steps!
export const USER_STEP_TYPE = {
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
  SET_VIEWPORT: 'setViewport'
} as const;

export const STEP_TYPE = {
  EMPTY: '', // TODO This should not be here as it is also used in the property options
  ...AUDIT_STEP_TYPE,
  ...ASSERTION_STEP_TYPE,
  ...USER_STEP_TYPE,
} as const;
