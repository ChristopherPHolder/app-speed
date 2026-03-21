import type { Meta, StoryObj } from '@storybook/angular';
import { StepFormGroup } from './audit-builder-form';
import { AuditStepComponent } from './audit-step.component';

const meta: Meta<AuditStepComponent> = {
  title: 'Patterns/Audit Builder/Step',
  component: AuditStepComponent,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<AuditStepComponent>;

export const Default: Story = {
  render: () => {
    return {
      props: {
        stepControl: new StepFormGroup({ type: '' } as never),
      },
    };
  },
};
