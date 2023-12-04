
// TODO Implement record control inputs types, this is an array of key value pairs.
// TODO Implement boolean control input type.
// TODO implement stringArray

import { StepDetails } from './audit-form-step.types';
import {
  ASSERTED_EVENTS,
  ATTRIBUTES,
  BUTTON,
  COUNT,
  DEVICE_TYPE,
  DOWNLOAD,
  DURATION,
  EXPRESSION,
  FRAME,
  KEY,
  LATENCY,
  OFFSETX,
  OFFSETY,
  OPERATOR,
  PROPERTIES,
  SELECTORS,
  TARGET,
  TIMEOUT,
  UPLOAD,
  VALUE,
  VISIBLE,
  X,
  Y,
  URL, DEVICE_SCALE_FACTOR, HAS_TOUCH, HEIGHT, IS_LANDSCAPE, IS_MOBILE, WIDTH,
} from './step-properties.schema';

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.WaitForElementStep.md
const WAIT_FOR_ELEMENT_STEP: StepDetails = {
  type: 'waitForElement',
  description: 'waitForElement allows waiting for the presence (or absence) of the number of elements identified by the selector.',
  properties: [
    ASSERTED_EVENTS,
    ATTRIBUTES,
    COUNT,
    FRAME,
    OPERATOR,
    PROPERTIES,
    { ...SELECTORS, required: true },
    TARGET,
    TIMEOUT,
    VISIBLE
  ]
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.WaitForExpressionStep.md
const WAIT_FOR_EXPRESSION_STEP: StepDetails = {
  type: 'waitForExpression',
  description: 'waitForExpression allows for a JavaScript expression to resolve to truthy value.',
  properties: [
    ASSERTED_EVENTS,
    { ...EXPRESSION, required: true },
    FRAME,
    TARGET,
    TIMEOUT,
  ]
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.ChangeStep.md
const CHANGE_STEP: StepDetails = {
  type: 'change',
  properties: [
    ASSERTED_EVENTS,
    FRAME,
    { ...SELECTORS, required: true },
    { ...VALUE, required: true },
  ]
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.ClickStep.md
const CLICK_STEP: StepDetails = {
  type: 'click',
  properties: [
    ASSERTED_EVENTS,
    BUTTON,
    DEVICE_TYPE,
    DURATION,
    FRAME,
    { ...OFFSETX, required: true },
    { ...OFFSETY, required: true },
    { ...SELECTORS, required: true },
    TARGET,
    TIMEOUT,
  ]
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.CloseStep.md
const CLOSE_STEP: StepDetails = {
  type: 'close',
  properties: [
    ASSERTED_EVENTS,
    TARGET,
    TIMEOUT
  ]
}

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.CustomStepParams.md
// const CUSTOM_STEP: StepDetails = {} TODO

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.DoubleClickStep.md
const DOUBLE_CLICK_STEP: StepDetails = {
  type: 'doubleClick',
  properties: [
    ASSERTED_EVENTS,
    BUTTON,
    DEVICE_TYPE,
    DURATION,
    FRAME,
    { ...OFFSETX, required: true },
    { ...OFFSETY, required: true },
    { ...SELECTORS, required: true },
    TARGET,
    TIMEOUT
  ]
}

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.EmulateNetworkConditionsStep.md
const EMULATE_NETWORK_CONDITIONS_STEP: StepDetails = {
  type: 'emulateNetworkConditions',
  properties: [
    ASSERTED_EVENTS,
    { ...DOWNLOAD, required: true },
    { ...LATENCY, required: true },
    TARGET,
    TIMEOUT,
    { ...UPLOAD, required: true },
  ]
}

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.HoverStep.md
const HOVER_STEP: StepDetails = {
  type: 'hover',
  properties: [
    ASSERTED_EVENTS,
    FRAME,
    { ...SELECTORS, required: true },
    TARGET,
    TIMEOUT
  ]
}

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.KeyDownStep.md
const KEY_DOWN_STEP: StepDetails = {
  type: 'keyDown',
  properties: [
    ASSERTED_EVENTS,
    { ...KEY, required: true },
    TARGET,
    TIMEOUT
  ]
}

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.KeyUpStep.md
const KEY_UP_STEP: StepDetails = {
  type: 'keyUp',
  properties: [
    ASSERTED_EVENTS,
    { ...KEY, required: true },
    TARGET,
    TIMEOUT
  ]
}

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.NavigateStep.md
const NAVIGATION_STEP: StepDetails = {
  type: 'navigation',
  properties: [
    ASSERTED_EVENTS,
    TARGET,
    TIMEOUT,
    { ...URL, required: true }
  ]
}

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.ScrollPageStep.md
const SCROLL_PAGE_STEP: StepDetails = {
  type: 'scroll',
  properties: [
    ASSERTED_EVENTS,
    FRAME,
    TARGET,
    TIMEOUT,
    X,
    Y
  ]
}

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.SetViewportStep.md
const SET_VIEWPORT_STEP: StepDetails = {
  type: 'setViewport',
  properties: [
    ASSERTED_EVENTS,
    { ...DEVICE_SCALE_FACTOR, required: true },
    { ...HAS_TOUCH, required: true },
    { ...HEIGHT, required: true },
    { ...IS_LANDSCAPE, required: true },
    { ...IS_MOBILE, required: true },
    TARGET,
    TIMEOUT,
    { ...WIDTH, required: true },
  ]
}

const PUPPETEER_ASSERTION_STEPS: StepDetails[] = [
  WAIT_FOR_ELEMENT_STEP,
  WAIT_FOR_EXPRESSION_STEP
];

const PUPPETEER_USER_STEPS = [
  CHANGE_STEP,
  CLICK_STEP,
  CLOSE_STEP,
  DOUBLE_CLICK_STEP,
  EMULATE_NETWORK_CONDITIONS_STEP,
  HOVER_STEP,
  KEY_DOWN_STEP,
  KEY_UP_STEP,
  NAVIGATION_STEP,
  SCROLL_PAGE_STEP,
  SET_VIEWPORT_STEP
];
