import { AUDIT_CUSTOM_STEP_TYPE, AuditStep, LIGHTHOUSE_AUDIT_STEP_TYPE, STEP_TYPE, StepType } from '@app-speed/audit/domain';
import { requiredFeature, STEP_PROPERTY, StepProperty } from './step-property.model';

type AuditStepSelection = (typeof LIGHTHOUSE_AUDIT_STEP_TYPE)[keyof typeof LIGHTHOUSE_AUDIT_STEP_TYPE];
type CustomStepSelection = (typeof AUDIT_CUSTOM_STEP_TYPE)[keyof typeof AUDIT_CUSTOM_STEP_TYPE];
type ReplayStepSelection = Exclude<StepType, typeof STEP_TYPE.CUSTOM_STEP>;

export type StepSelection = ReplayStepSelection | AuditStepSelection | CustomStepSelection;
export type Step = AuditStep | { type: '' };

export type StepDetails<TStep extends Step = Step> = {
  selection: StepSelection | '';
  step: TStep;
  properties: StepProperty[];
  description?: string;
};

export const EMPTY_STEP: StepDetails<{ type: '' }> = {
  selection: '',
  step: { type: '' },
  properties: [],
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.WaitForElementStep.md
const WAIT_FOR_ELEMENT_STEP: StepDetails = {
  selection: STEP_TYPE.WAIT_FOR_ELEMENT,
  step: { type: STEP_TYPE.WAIT_FOR_ELEMENT, count: 1, selectors: [] },
  description:
    'waitForElement allows waiting for the presence (or absence) of the number of elements identified by the selector.',
  properties: [
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
  selection: STEP_TYPE.WAIT_FOR_EXPRESSION,
  step: { type: STEP_TYPE.WAIT_FOR_EXPRESSION, expression: '' },
  description: 'waitForExpression allows for a JavaScript expression to resolve to truthy value.',
  properties: [
    STEP_PROPERTY.assertEvents,
    requiredFeature(STEP_PROPERTY.expression),
    STEP_PROPERTY.frame,
    STEP_PROPERTY.target,
    STEP_PROPERTY.timeout,
  ],
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.ChangeStep.md
const CHANGE_STEP: StepDetails = {
  selection: STEP_TYPE.CHANGE,
  step: { type: STEP_TYPE.CHANGE, selectors: [], value: '' },
  properties: [
    STEP_PROPERTY.assertEvents,
    STEP_PROPERTY.frame,
    requiredFeature(STEP_PROPERTY.selectors),
    requiredFeature(STEP_PROPERTY.value),
  ],
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.ClickStep.md
const CLICK_STEP: StepDetails = {
  selection: STEP_TYPE.CLICK,
  step: { type: STEP_TYPE.CLICK, offsetX: 1, offsetY: 1, selectors: [] },
  properties: [
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
  selection: STEP_TYPE.CLOSE,
  step: { type: STEP_TYPE.CLOSE },
  properties: [STEP_PROPERTY.assertEvents, STEP_PROPERTY.target, STEP_PROPERTY.timeout],
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.CustomStepParams.md
// const CUSTOM_STEP: StepDetails = {} TODO

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.DoubleClickStep.md
const DOUBLE_CLICK_STEP: StepDetails = {
  selection: STEP_TYPE.DOUBLE_CLICK,
  step: { type: STEP_TYPE.DOUBLE_CLICK, offsetX: 1, offsetY: 1, selectors: [] },
  properties: [
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
  selection: STEP_TYPE.EMULATE_NETWORK_CONDITIONS,
  step: { type: STEP_TYPE.EMULATE_NETWORK_CONDITIONS, download: 1, latency: 1, upload: 1 },
  properties: [
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
  selection: STEP_TYPE.HOVER,
  step: { type: STEP_TYPE.HOVER, selectors: [] },
  properties: [
    STEP_PROPERTY.assertEvents,
    STEP_PROPERTY.frame,
    requiredFeature(STEP_PROPERTY.selectors),
    STEP_PROPERTY.target,
    STEP_PROPERTY.timeout,
  ],
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.KeyDownStep.md
const KEY_DOWN_STEP: StepDetails = {
  selection: STEP_TYPE.KEY_DOWN,
  step: { type: STEP_TYPE.KEY_DOWN, key: 'Enter' },
  properties: [
    STEP_PROPERTY.assertEvents,
    requiredFeature(STEP_PROPERTY.key),
    STEP_PROPERTY.target,
    STEP_PROPERTY.timeout,
  ],
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.KeyUpStep.md
const KEY_UP_STEP: StepDetails = {
  selection: STEP_TYPE.KEY_UP,
  step: { type: STEP_TYPE.KEY_UP, key: 'Enter' },
  properties: [
    STEP_PROPERTY.assertEvents,
    requiredFeature(STEP_PROPERTY.key),
    STEP_PROPERTY.target,
    STEP_PROPERTY.timeout,
  ],
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.NavigateStep.md
const NAVIGATE_STEP: StepDetails = {
  selection: STEP_TYPE.NAVIGATE,
  step: { type: STEP_TYPE.NAVIGATE, url: '' },
  properties: [
    STEP_PROPERTY.assertEvents,
    STEP_PROPERTY.target,
    STEP_PROPERTY.timeout,
    requiredFeature(STEP_PROPERTY.url),
  ],
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.ScrollPageStep.md
const SCROLL_PAGE_STEP: StepDetails = {
  selection: STEP_TYPE.SCROLL,
  step: { type: STEP_TYPE.SCROLL, selectors: [], x: 1, y: 1 },
  properties: [
    STEP_PROPERTY.assertEvents,
    STEP_PROPERTY.frame,
    requiredFeature(STEP_PROPERTY.selectors),
    STEP_PROPERTY.target,
    STEP_PROPERTY.timeout,
    STEP_PROPERTY.x,
    STEP_PROPERTY.y,
  ],
};

// DOCS https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.SetViewportStep.md
const SET_VIEWPORT_STEP: StepDetails = {
  selection: STEP_TYPE.SET_VIEWPORT,
  step: {
    type: STEP_TYPE.SET_VIEWPORT,
    deviceScaleFactor: 1,
    hasTouch: false,
    height: 1,
    isLandscape: false,
    isMobile: false,
    width: 1,
  },
  properties: [
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
  selection: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
  step: { type: STEP_TYPE.CUSTOM_STEP, step: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION },
  properties: [requiredFeature(STEP_PROPERTY.name)],
};

const END_NAVIGATION: StepDetails = {
  selection: LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
  step: { type: STEP_TYPE.CUSTOM_STEP, step: LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION },
  properties: [],
};

const START_TIMESPAN: StepDetails = {
  selection: LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN,
  step: { type: STEP_TYPE.CUSTOM_STEP, step: LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN },
  properties: [requiredFeature(STEP_PROPERTY.name)],
};

const END_TIMESPAN: StepDetails = {
  selection: LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN,
  step: { type: STEP_TYPE.CUSTOM_STEP, step: LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN },
  properties: [],
};

const SNAPSHOT: StepDetails = {
  selection: LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT,
  step: { type: STEP_TYPE.CUSTOM_STEP, step: LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT },
  properties: [requiredFeature(STEP_PROPERTY.name)],
};

const CLEAR_CACHE: StepDetails = {
  selection: AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE,
  step: { type: STEP_TYPE.CUSTOM_STEP, step: AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE },
  properties: [],
};

const ADD_COOKIE: StepDetails = {
  selection: AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE,
  step: {
    type: STEP_TYPE.CUSTOM_STEP,
    step: AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE,
    name: '',
    value: '',
    url: '',
  },
  properties: [
    requiredFeature(STEP_PROPERTY.name),
    requiredFeature(STEP_PROPERTY.value),
    requiredFeature(STEP_PROPERTY.url),
    STEP_PROPERTY.domain,
    STEP_PROPERTY.path,
    STEP_PROPERTY.secure,
    STEP_PROPERTY.httpOnly,
    STEP_PROPERTY.sameSite,
  ],
};

const AUDIT_STEPS: StepDetails[] = [START_NAVIGATION, END_NAVIGATION, START_TIMESPAN, END_TIMESPAN, SNAPSHOT];
const CUSTOM_STEPS: StepDetails[] = [CLEAR_CACHE, ADD_COOKIE];

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

export const STEP_OPTIONS = [EMPTY_STEP, ASSERTION_STEPS, USER_STEPS, AUDIT_STEPS, CUSTOM_STEPS].flat();

export const stepSelectionFromStep = (step: Step): StepSelection | '' =>
  step.type === STEP_TYPE.CUSTOM_STEP ? step.step : step.type;

export const findStepDetails = (selection: StepSelection | ''): StepDetails =>
  STEP_OPTIONS.find((step) => step.selection === selection) ?? EMPTY_STEP;
