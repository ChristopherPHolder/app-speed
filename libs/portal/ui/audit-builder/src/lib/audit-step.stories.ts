import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { STEP_TYPE } from '@app-speed/shared-user-flow-replay';
import { provideAuditBuilderIcons } from './audit-builder-icons.provider';
import { StepFormGroup } from './audit-builder-form';
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

const createStory = (type: (typeof STEP_TYPE)[keyof typeof STEP_TYPE]): Story => ({
  render: () => {
    return { props: { stepControl: new StepFormGroup({ type } as never) } };
  },
});

export const Empty = createStory(STEP_TYPE.EMPTY);
export const StartNavigation = createStory(STEP_TYPE.START_NAVIGATION);
export const EndNavigation = createStory(STEP_TYPE.END_NAVIGATION);
export const StartTimespan = createStory(STEP_TYPE.START_TIMESPAN);
export const EndTimespan = createStory(STEP_TYPE.END_TIMESPAN);
export const Snapshot = createStory(STEP_TYPE.SNAPSHOT);
export const WaitForElement = createStory(STEP_TYPE.WAIT_FOR_ELEMENT);
export const WaitForExpression = createStory(STEP_TYPE.WAIT_FOR_EXPRESSION);
export const Change = createStory(STEP_TYPE.CHANGE);
export const Click = createStory(STEP_TYPE.CLICK);
export const Close = createStory(STEP_TYPE.CLOSE);
export const DoubleClick = createStory(STEP_TYPE.DOUBLE_CLICK);
export const EmulateNetworkConditions = createStory(STEP_TYPE.EMULATE_NETWORK_CONDITIONS);
export const Hover = createStory(STEP_TYPE.HOVER);
export const KeyDown = createStory(STEP_TYPE.KEY_DOWN);
export const KeyUp = createStory(STEP_TYPE.KEY_UP);
export const Navigate = createStory(STEP_TYPE.NAVIGATE);
export const Scroll = createStory(STEP_TYPE.SCROLL);
export const SetViewport = createStory(STEP_TYPE.SET_VIEWPORT);
