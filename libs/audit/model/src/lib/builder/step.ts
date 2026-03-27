// TODO Implement record control inputs types, this is an array of key value pairs.
// TODO Implement boolean control input type.
// TODO implement stringArray

import { requiredFeature, STEP_PROPERTY, StepProperty } from './step-property';
import { STEP_TYPE, StepType } from './step-type';
import { PROPERTY_NAME, PropertyName } from './property-name';
import { InputType } from './input-type';

export type StepDetails = {
  type: StepType;
  properties: StepProperty[];
  description?: string;
};

export const EMPTY_STEP: StepDetails = {
  type: STEP_TYPE.EMPTY,
  properties: [STEP_PROPERTY.type],
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.WaitForElementStep.md
const WAIT_FOR_ELEMENT_STEP: StepDetails = {
  type: STEP_TYPE.WAIT_FOR_ELEMENT,
  description:
    'waitForElement allows waiting for the presence (or absence) of the number of elements identified by the selector.',
  properties: [
    STEP_PROPERTY.type,
    STEP_PROPERTY.assertEvents,
    STEP_PROPERTY.attributes,
    STEP_PROPERTY.count,
    STEP_PROPERTY.frame,
    STEP_PROPERTY.operator,
    STEP_PROPERTY.properties,
    requiredFeature(STEP_PROPERTY.selectors),
    STEP_PROPERTY.target,
    STEP_PROPERTY.timeout,
    STEP_PROPERTY.visible,
  ],
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.WaitForExpressionStep.md
const WAIT_FOR_EXPRESSION_STEP: StepDetails = {
  type: STEP_TYPE.WAIT_FOR_EXPRESSION,
  description: 'waitForExpression allows for a JavaScript expression to resolve to truthy value.',
  properties: [
    STEP_PROPERTY.type,
    STEP_PROPERTY.assertEvents,
    requiredFeature(STEP_PROPERTY.expression),
    STEP_PROPERTY.frame,
    STEP_PROPERTY.target,
    STEP_PROPERTY.timeout,
  ],
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.ChangeStep.md
const CHANGE_STEP: StepDetails = {
  type: STEP_TYPE.CHANGE,
  properties: [
    STEP_PROPERTY.type,
    STEP_PROPERTY.assertEvents,
    STEP_PROPERTY.frame,
    requiredFeature(STEP_PROPERTY.selectors),
    requiredFeature(STEP_PROPERTY.value),
  ],
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.ClickStep.md
const CLICK_STEP: StepDetails = {
  type: STEP_TYPE.CLICK,
  properties: [
    STEP_PROPERTY.type,
    STEP_PROPERTY.assertEvents,
    STEP_PROPERTY.button,
    STEP_PROPERTY.deviceType,
    STEP_PROPERTY.duration,
    STEP_PROPERTY.frame,
    requiredFeature(STEP_PROPERTY.offsetX),
    requiredFeature(STEP_PROPERTY.offsetY),
    requiredFeature(STEP_PROPERTY.selectors),
    STEP_PROPERTY.target,
    STEP_PROPERTY.timeout,
  ],
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.CloseStep.md
const CLOSE_STEP: StepDetails = {
  type: STEP_TYPE.CLOSE,
  properties: [STEP_PROPERTY.type, STEP_PROPERTY.assertEvents, STEP_PROPERTY.target, STEP_PROPERTY.timeout],
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.CustomStepParams.md
// const CUSTOM_STEP: StepDetails = {} TODO

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.DoubleClickStep.md
const DOUBLE_CLICK_STEP: StepDetails = {
  type: STEP_TYPE.DOUBLE_CLICK,
  properties: [
    STEP_PROPERTY.type,
    STEP_PROPERTY.assertEvents,
    STEP_PROPERTY.button,
    STEP_PROPERTY.deviceType,
    STEP_PROPERTY.duration,
    STEP_PROPERTY.frame,
    requiredFeature(STEP_PROPERTY.offsetX),
    requiredFeature(STEP_PROPERTY.offsetY),
    requiredFeature(STEP_PROPERTY.selectors),
    STEP_PROPERTY.target,
    STEP_PROPERTY.timeout,
  ],
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.EmulateNetworkConditionsStep.md
const EMULATE_NETWORK_CONDITIONS_STEP: StepDetails = {
  type: STEP_TYPE.EMULATE_NETWORK_CONDITIONS,
  properties: [
    STEP_PROPERTY.type,
    STEP_PROPERTY.assertEvents,
    requiredFeature(STEP_PROPERTY.download),
    requiredFeature(STEP_PROPERTY.latency),
    STEP_PROPERTY.target,
    STEP_PROPERTY.timeout,
    requiredFeature(STEP_PROPERTY.upload),
  ],
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.HoverStep.md
const HOVER_STEP: StepDetails = {
  type: STEP_TYPE.HOVER,
  properties: [
    STEP_PROPERTY.type,
    STEP_PROPERTY.assertEvents,
    STEP_PROPERTY.frame,
    requiredFeature(STEP_PROPERTY.selectors),
    STEP_PROPERTY.target,
    STEP_PROPERTY.timeout,
  ],
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.KeyDownStep.md
const KEY_DOWN_STEP: StepDetails = {
  type: STEP_TYPE.KEY_DOWN,
  properties: [
    STEP_PROPERTY.type,
    STEP_PROPERTY.assertEvents,
    requiredFeature(STEP_PROPERTY.key),
    STEP_PROPERTY.target,
    STEP_PROPERTY.timeout,
  ],
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.KeyUpStep.md
const KEY_UP_STEP: StepDetails = {
  type: STEP_TYPE.KEY_UP,
  properties: [
    STEP_PROPERTY.type,
    STEP_PROPERTY.assertEvents,
    requiredFeature(STEP_PROPERTY.key),
    STEP_PROPERTY.target,
    STEP_PROPERTY.timeout,
  ],
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.NavigateStep.md
const NAVIGATE_STEP: StepDetails = {
  type: STEP_TYPE.NAVIGATE,
  properties: [
    STEP_PROPERTY.type,
    STEP_PROPERTY.assertEvents,
    STEP_PROPERTY.target,
    STEP_PROPERTY.timeout,
    requiredFeature(STEP_PROPERTY.url),
  ],
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.ScrollPageStep.md
const SCROLL_PAGE_STEP: StepDetails = {
  type: STEP_TYPE.SCROLL,
  properties: [
    STEP_PROPERTY.type,
    STEP_PROPERTY.assertEvents,
    STEP_PROPERTY.frame,
    STEP_PROPERTY.target,
    STEP_PROPERTY.timeout,
    STEP_PROPERTY.x,
    STEP_PROPERTY.y,
  ],
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.SetViewportStep.md
const SET_VIEWPORT_STEP: StepDetails = {
  type: STEP_TYPE.SET_VIEWPORT,
  properties: [
    STEP_PROPERTY.type,
    STEP_PROPERTY.assertEvents,
    requiredFeature(STEP_PROPERTY.deviceScaleFactor),
    requiredFeature(STEP_PROPERTY.hasTouch),
    requiredFeature(STEP_PROPERTY.height),
    requiredFeature(STEP_PROPERTY.isLandscape),
    requiredFeature(STEP_PROPERTY.isMobile),
    STEP_PROPERTY.target,
    STEP_PROPERTY.timeout,
    requiredFeature(STEP_PROPERTY.width),
  ],
};

const START_NAVIGATION: StepDetails = {
  type: STEP_TYPE.START_NAVIGATION,
  properties: [STEP_PROPERTY.type, requiredFeature(STEP_PROPERTY.name)],
};

const END_NAVIGATION: StepDetails = {
  type: STEP_TYPE.END_NAVIGATION,
  properties: [STEP_PROPERTY.type],
};

const START_TIMESPAN: StepDetails = {
  type: STEP_TYPE.START_TIMESPAN,
  properties: [STEP_PROPERTY.type, requiredFeature(STEP_PROPERTY.name)],
};

const END_TIMESPAN: StepDetails = {
  type: STEP_TYPE.END_TIMESPAN,
  properties: [STEP_PROPERTY.type],
};

const SNAPSHOT: StepDetails = {
  type: STEP_TYPE.SNAPSHOT,
  properties: [STEP_PROPERTY.type, requiredFeature(STEP_PROPERTY.name)],
};

const AUDIT_STEPS: StepDetails[] = [START_NAVIGATION, END_NAVIGATION, START_TIMESPAN, END_TIMESPAN, SNAPSHOT];

const ASSERTION_STEPS: StepDetails[] = [WAIT_FOR_ELEMENT_STEP, WAIT_FOR_EXPRESSION_STEP];

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
  SET_VIEWPORT_STEP,
];

export const STEP_OPTIONS = [EMPTY_STEP, ASSERTION_STEPS, USER_STEPS, AUDIT_STEPS].flat();

// @TODO improve this type
export type Step = { [PROPERTY_NAME.TYPE]: StepType } & Partial<Record<PropertyName, InputType>>;
