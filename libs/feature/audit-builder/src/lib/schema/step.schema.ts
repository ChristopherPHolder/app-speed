
// TODO Implement record control inputs types, this is an array of key value pairs.
// TODO Implement boolean control input type.
// TODO implement stringArray

import { StepDetails, StepProperty } from './types';
import { STEP_PROPERTY } from './properties.schema';
import { STEP_TYPE } from './step.constants';

const requiredFeature = (property: StepProperty): StepProperty => ({...property, required: true});

export const EMPTY_STEP: StepDetails = {
  type: STEP_TYPE.EMPTY,
  properties: [
    STEP_PROPERTY.TYPE
  ]
}

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.WaitForElementStep.md
const WAIT_FOR_ELEMENT_STEP: StepDetails = {
  type: STEP_TYPE.WAIT_FOR_ELEMENT,
  description: 'waitForElement allows waiting for the presence (or absence) of the number of elements identified by the selector.',
  properties: [
    STEP_PROPERTY.TYPE,
    STEP_PROPERTY.ASSERTED_EVENTS,
    STEP_PROPERTY.ATTRIBUTES,
    STEP_PROPERTY.COUNT,
    STEP_PROPERTY.FRAME,
    STEP_PROPERTY.OPERATOR,
    STEP_PROPERTY.PROPERTIES,
    requiredFeature(STEP_PROPERTY.SELECTORS),
    STEP_PROPERTY.TARGET,
    STEP_PROPERTY.TIMEOUT,
    STEP_PROPERTY.VISIBLE
  ]
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.WaitForExpressionStep.md
const WAIT_FOR_EXPRESSION_STEP: StepDetails = {
  type: STEP_TYPE.WAIT_FOR_EXPRESSION,
  description: 'waitForExpression allows for a JavaScript expression to resolve to truthy value.',
  properties: [
    STEP_PROPERTY.TYPE,
    STEP_PROPERTY.ASSERTED_EVENTS,
    requiredFeature(STEP_PROPERTY.EXPRESSION),
    STEP_PROPERTY.FRAME,
    STEP_PROPERTY.TARGET,
    STEP_PROPERTY.TIMEOUT,
  ]
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.ChangeStep.md
const CHANGE_STEP: StepDetails = {
  type: STEP_TYPE.CHANGE,
  properties: [
    STEP_PROPERTY.TYPE,
    STEP_PROPERTY.ASSERTED_EVENTS,
    STEP_PROPERTY.FRAME,
    requiredFeature(STEP_PROPERTY.SELECTORS),
    requiredFeature(STEP_PROPERTY.VALUE),
  ]
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.ClickStep.md
const CLICK_STEP: StepDetails = {
  type: STEP_TYPE.CLICK,
  properties: [
    STEP_PROPERTY.TYPE,
    STEP_PROPERTY.ASSERTED_EVENTS,
    STEP_PROPERTY.BUTTON,
    STEP_PROPERTY.DEVICE_TYPE,
    STEP_PROPERTY.DURATION,
    STEP_PROPERTY.FRAME,
    requiredFeature(STEP_PROPERTY.OFFSET_X),
    requiredFeature(STEP_PROPERTY.OFFSET_Y),
    requiredFeature(STEP_PROPERTY.SELECTORS),
    STEP_PROPERTY.TARGET,
    STEP_PROPERTY.TIMEOUT,
  ]
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.CloseStep.md
const CLOSE_STEP: StepDetails = {
  type: STEP_TYPE.CLOSE,
  properties: [
    STEP_PROPERTY.TYPE,
    STEP_PROPERTY.ASSERTED_EVENTS,
    STEP_PROPERTY.TARGET,
    STEP_PROPERTY.TIMEOUT
  ]
}

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.CustomStepParams.md
// const CUSTOM_STEP: StepDetails = {} TODO

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.DoubleClickStep.md
const DOUBLE_CLICK_STEP: StepDetails = {
  type: STEP_TYPE.DOUBLE_CLICK,
  properties: [
    STEP_PROPERTY.TYPE,
    STEP_PROPERTY.ASSERTED_EVENTS,
    STEP_PROPERTY.BUTTON,
    STEP_PROPERTY.DEVICE_TYPE,
    STEP_PROPERTY.DURATION,
    STEP_PROPERTY.FRAME,
    requiredFeature(STEP_PROPERTY.OFFSET_X),
    requiredFeature(STEP_PROPERTY.OFFSET_Y),
    requiredFeature(STEP_PROPERTY.SELECTORS),
    STEP_PROPERTY.TARGET,
    STEP_PROPERTY.TIMEOUT
  ]
}

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.EmulateNetworkConditionsStep.md
const EMULATE_NETWORK_CONDITIONS_STEP: StepDetails = {
  type: STEP_TYPE.EMULATE_NETWORK_CONDITIONS,
  properties: [
    STEP_PROPERTY.TYPE,
    STEP_PROPERTY.ASSERTED_EVENTS,
    requiredFeature(STEP_PROPERTY.DOWNLOAD),
    requiredFeature(STEP_PROPERTY.LATENCY),
    STEP_PROPERTY.TARGET,
    STEP_PROPERTY.TIMEOUT,
    requiredFeature(STEP_PROPERTY.UPLOAD)
  ]
}

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.HoverStep.md
const HOVER_STEP: StepDetails = {
  type: STEP_TYPE.HOVER,
  properties: [
    STEP_PROPERTY.TYPE,
    STEP_PROPERTY.ASSERTED_EVENTS,
    STEP_PROPERTY.FRAME,
    requiredFeature(STEP_PROPERTY.SELECTORS),
    STEP_PROPERTY.TARGET,
    STEP_PROPERTY.TIMEOUT
  ]
}

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.KeyDownStep.md
const KEY_DOWN_STEP: StepDetails = {
  type: STEP_TYPE.KEY_DOWN,
  properties: [
    STEP_PROPERTY.TYPE,
    STEP_PROPERTY.ASSERTED_EVENTS,
    requiredFeature(STEP_PROPERTY.KEY),
    STEP_PROPERTY.TARGET,
    STEP_PROPERTY.TIMEOUT
  ]
}

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.KeyUpStep.md
const KEY_UP_STEP: StepDetails = {
  type: STEP_TYPE.KEY_UP,
  properties: [
    STEP_PROPERTY.TYPE,
    STEP_PROPERTY.ASSERTED_EVENTS,
    requiredFeature(STEP_PROPERTY.KEY),
    STEP_PROPERTY.TARGET,
    STEP_PROPERTY.TIMEOUT
  ]
}

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.NavigateStep.md
const NAVIGATE_STEP: StepDetails = {
  type: STEP_TYPE.NAVIGATE,
  properties: [
    STEP_PROPERTY.TYPE,
    STEP_PROPERTY.ASSERTED_EVENTS,
    STEP_PROPERTY.TARGET,
    STEP_PROPERTY.TIMEOUT,
    requiredFeature(STEP_PROPERTY.URL),
  ]
}

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.ScrollPageStep.md
const SCROLL_PAGE_STEP: StepDetails = {
  type: STEP_TYPE.SCROLL,
  properties: [
    STEP_PROPERTY.TYPE,
    STEP_PROPERTY.ASSERTED_EVENTS,
    STEP_PROPERTY.FRAME,
    STEP_PROPERTY.TARGET,
    STEP_PROPERTY.TIMEOUT,
    STEP_PROPERTY.X,
    STEP_PROPERTY.Y
  ]
}

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.SetViewportStep.md
const SET_VIEWPORT_STEP: StepDetails = {
  type: STEP_TYPE.SET_VIEWPORT,
  properties: [
    STEP_PROPERTY.TYPE,
    STEP_PROPERTY.ASSERTED_EVENTS,
    requiredFeature(STEP_PROPERTY.DEVICE_SCALE_FACTOR),
    requiredFeature(STEP_PROPERTY.HAS_TOUCH),
    requiredFeature(STEP_PROPERTY.HEIGHT),
    requiredFeature(STEP_PROPERTY.IS_LANDSCAPE),
    requiredFeature(STEP_PROPERTY.IS_MOBILE),
    STEP_PROPERTY.TARGET,
    STEP_PROPERTY.TIMEOUT,
    requiredFeature(STEP_PROPERTY.WIDTH),
  ]
}

const START_NAVIGATION: StepDetails = {
  type: STEP_TYPE.START_NAVIGATION,
  properties: [
    STEP_PROPERTY.TYPE,
    requiredFeature(STEP_PROPERTY.NAME),
  ]
}

const END_NAVIGATION: StepDetails = {
  type: STEP_TYPE.END_NAVIGATION,
  properties: [
    STEP_PROPERTY.TYPE
  ]
}

const START_TIMESPAN: StepDetails = {
  type: STEP_TYPE.START_TIMESPAN,
  properties: [
    STEP_PROPERTY.TYPE,
    requiredFeature(STEP_PROPERTY.NAME),
  ]
}

const END_TIMESPAN: StepDetails = {
  type: STEP_TYPE.END_TIMESPAN,
  properties: [
    STEP_PROPERTY.TYPE
  ]
}

const SNAPSHOT: StepDetails = {
  type: STEP_TYPE.SNAPSHOT,
  properties: [
    STEP_PROPERTY.TYPE,
    requiredFeature(STEP_PROPERTY.NAME),
  ]
}

const AUDIT_STEPS: StepDetails[] = [
  START_NAVIGATION,
  END_NAVIGATION,
  START_TIMESPAN,
  END_TIMESPAN,
  SNAPSHOT
]

const ASSERTION_STEPS: StepDetails[] = [
  WAIT_FOR_ELEMENT_STEP,
  WAIT_FOR_EXPRESSION_STEP
];

const USER_STEPS: StepDetails[] = [
  CHANGE_STEP,
  CLICK_STEP,
  CLOSE_STEP,
  DOUBLE_CLICK_STEP,
  EMULATE_NETWORK_CONDITIONS_STEP,
  HOVER_STEP,
  KEY_DOWN_STEP,
  KEY_UP_STEP,
  NAVIGATE_STEP,
  SCROLL_PAGE_STEP,
  SET_VIEWPORT_STEP
];

export const STEP_OPTIONS = [
  EMPTY_STEP,
  ASSERTION_STEPS,
  USER_STEPS,
  AUDIT_STEPS
].flat()
