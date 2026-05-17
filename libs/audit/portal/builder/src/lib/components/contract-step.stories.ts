import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { provideAuditBuilderIcons } from '@app-speed/audit/portal/ui/icons';
import { ContractStepComponent } from './contract-step.component';

const meta: Meta<ContractStepComponent> = {
  title: 'Patterns/Audit Builder/Contract Step',
  component: ContractStepComponent,
  decorators: [applicationConfig({ providers: [provideAuditBuilderIcons()] })],
  args: {
    showPreview: true,
  },
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<ContractStepComponent>;

const createStory = (variantId: string): Story => ({
  args: {
    variantId,
  },
});

export const WaitForElement = createStory('waitForElement');
export const WaitForExpression = createStory('waitForExpression');
export const Change = createStory('change');
export const Click = createStory('click');
export const Close = createStory('close');
export const DoubleClick = createStory('doubleClick');
export const EmulateNetworkConditions = createStory('emulateNetworkConditions');
export const Hover = createStory('hover');
export const KeyDown = createStory('keyDown');
export const KeyUp = createStory('keyUp');
export const Navigate = createStory('navigate');
export const Scroll = createStory('scroll');
export const SetViewport = createStory('setViewport');
export const StartNavigation = createStory('startNavigation');
export const EndNavigation = createStory('endNavigation');
export const StartTimespan = createStory('startTimespan');
export const EndTimespan = createStory('endTimespan');
export const Snapshot = createStory('snapshot');
export const ClearCache = createStory('clearCache');
export const AddCookie = createStory('addCookie');
