import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { provideAuditBuilderIcons } from '@app-speed/audit/portal/ui/icons';
import { LIGHTHOUSE_AUDIT_STEP_TYPE, STEP_TYPE } from '@app-speed/audit/domain';
import { Step, StepFormGroup } from './audit-builder-form';
import { AuditStepComponent } from './audit-step.component';

const meta: Meta<AuditStepComponent> = {
  title: 'Patterns/Audit Builder/Step',
  component: AuditStepComponent,
  decorators: [applicationConfig({ providers: [provideAuditBuilderIcons()] })],
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
export const DoubleClick = createStory({ type: STEP_TYPE.DOUBLE_CLICK, offsetX: 1, offsetY: 1, selectors: selectorPath });
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
