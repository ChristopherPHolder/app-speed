import { applicationConfig, componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { provideAuditBuilderIcons } from '@app-speed/audit/core/portal-ui/icons';
import { STEP_TYPE } from '@app-speed/audit/core/domain';
import { LIGHTHOUSE_AUDIT_STEP_TYPE } from '@app-speed/audit/user-flow/domain';
import { Step, StepFormGroup } from './audit-builder-form';
import { AuditStepComponent } from './audit-step.component';

const meta: Meta<AuditStepComponent> = {
  title: 'Patterns/Audit Builder/Step',
  component: AuditStepComponent,
  decorators: [
    applicationConfig({ providers: [provideAuditBuilderIcons()] }),
    // A step is never wider than the builder's card.
    componentWrapperDecorator(
      (story) => `<div style="max-width: var(--ui-page-width-medium); margin: 0 auto;">${story}</div>`,
    ),
  ],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<AuditStepComponent>;

const selectorPath = [{ segments: ['[data-test=target]'] }] as const;

const createStory = (step: Step): Story => ({
  render: () => {
    return { props: { stepControl: new StepFormGroup(step) } };
  },
});

/** The step as it looks once every field has been visited, so validation messages show. */
const createTouchedStory = (step: Step): Story => ({
  render: () => {
    const stepControl = new StepFormGroup(step);
    stepControl.markAllAsTouched();
    return { props: { stepControl } };
  },
});

export const Empty = createStory({ type: '' });
export const StartNavigation = createStory({
  type: STEP_TYPE.CUSTOM_STEP,
  step: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
});
export const EndNavigation = createStory({
  type: STEP_TYPE.CUSTOM_STEP,
  step: LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
});
export const StartTimespan = createStory({
  type: STEP_TYPE.CUSTOM_STEP,
  step: LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN,
});
export const EndTimespan = createStory({
  type: STEP_TYPE.CUSTOM_STEP,
  step: LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN,
});
export const Snapshot = createStory({
  type: STEP_TYPE.CUSTOM_STEP,
  step: LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT,
});
export const WaitForElement = createStory({ type: STEP_TYPE.WAIT_FOR_ELEMENT, count: 1, selectors: selectorPath });
export const WaitForExpression = createStory({ type: STEP_TYPE.WAIT_FOR_EXPRESSION, expression: '' });
export const Change = createStory({ type: STEP_TYPE.CHANGE, selectors: selectorPath, value: '' });
export const Click = createStory({ type: STEP_TYPE.CLICK, offsetX: 1, offsetY: 1, selectors: selectorPath });
export const Close = createStory({ type: STEP_TYPE.CLOSE });
export const DoubleClick = createStory({
  type: STEP_TYPE.DOUBLE_CLICK,
  offsetX: 1,
  offsetY: 1,
  selectors: selectorPath,
});
export const EmulateNetworkConditions = createStory({
  type: STEP_TYPE.EMULATE_NETWORK_CONDITIONS,
  download: 1,
  latency: 1,
  upload: 1,
});
export const Hover = createStory({ type: STEP_TYPE.HOVER, selectors: selectorPath });
export const KeyDown = createStory({ type: STEP_TYPE.KEY_DOWN, key: 'Enter' });
export const KeyUp = createStory({ type: STEP_TYPE.KEY_UP, key: 'Enter' });
export const Navigate = createStory({ type: STEP_TYPE.NAVIGATE, url: '' });
export const Scroll = createStory({ type: STEP_TYPE.SCROLL, selectors: selectorPath, x: 1, y: 1 });
export const SetViewport = createStory({
  type: STEP_TYPE.SET_VIEWPORT,
  deviceScaleFactor: 1,
  hasTouch: false,
  height: 1,
  isLandscape: false,
  isMobile: false,
  width: 1,
});

/** Optional properties of each type: enums, numbers, text and a list of numbers. */
export const ClickWithOptionalProperties = createStory({
  type: STEP_TYPE.CLICK,
  offsetX: 1,
  offsetY: 1,
  selectors: selectorPath,
  button: 'primary',
  deviceType: 'mouse',
  duration: 50,
  frame: [0, 1],
  target: 'https://example.com/popup',
  timeout: 5000,
});

/** A list of groups. */
export const NavigateWithAssertedEvents = createStory({
  type: STEP_TYPE.NAVIGATE,
  url: 'https://example.com',
  assertedEvents: [{ type: 'navigation', title: 'Checkout', url: 'https://example.com/checkout' }],
});

/** Key/value properties, an enum and a flag. */
export const WaitForElementWithAttributes = createStory({
  type: STEP_TYPE.WAIT_FOR_ELEMENT,
  count: 1,
  selectors: selectorPath,
  attributes: { 'aria-expanded': 'true' },
  properties: {},
  operator: '>=',
  visible: true,
});

/** Long hints, which wrap in compact windows. */
export const WaitForNetworkIdle = createStory({
  type: STEP_TYPE.CUSTOM_STEP,
  step: 'waitForNetworkIdle',
  idleTime: 500,
  timeout: 0,
  concurrency: 0,
});

/** Optional properties that were added and left blank or given a value the schema rejects. */
export const InvalidOptionalProperties = createTouchedStory({
  type: STEP_TYPE.CLICK,
  offsetX: 1,
  offsetY: 1,
  selectors: selectorPath,
  button: '',
  duration: null,
  timeout: -5,
} as unknown as Step);
