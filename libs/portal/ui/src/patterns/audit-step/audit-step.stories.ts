import { Meta, StoryObj } from '@storybook/angular';
import { AuditStepComponent } from './audit-step.component';

const meta: Meta<AuditStepComponent> = {
  title: 'Patterns/Audit Step',
  component: AuditStepComponent,
};
export default meta;

type Story = StoryObj<AuditStepComponent>;

export const Default: Story = {};

export const StartNavigation: Story = {
  args: {
    stepDetails: {
      type: 'startNavigation',
      name: 'Initial Navigation',
    },
  },
};
