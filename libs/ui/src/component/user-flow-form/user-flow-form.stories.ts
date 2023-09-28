import { Meta, StoryObj } from '@storybook/angular';
import { UserFlowFormComponent } from './user-flow-form.component';
import { of } from 'rxjs';

const meta: Meta<UserFlowFormComponent> = {
  title: 'Components/User-Flow Form',
  component: UserFlowFormComponent,
};
export default meta;

type Story = StoryObj<UserFlowFormComponent>;

const disabled = of(false);
const enabled = of(true);

export const Enabled: Story = { args: { disabled: enabled } };
export const Disabled: Story = { args: { disabled: disabled } };
