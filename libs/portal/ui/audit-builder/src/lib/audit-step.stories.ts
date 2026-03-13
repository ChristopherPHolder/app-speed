import type { AuditStep } from '@app-speed/shared-user-flow-replay/schema';
import type { Meta, StoryObj } from '@storybook/angular';
import { StepFormGroup } from './audit-builder-form';
import { AuditStepComponent } from './audit-step.component';

type AuditStepStoryArgs = {
  step: AuditStep;
};

const meta = {
  title: 'Patterns/Audit Builder/Step',
  component: AuditStepComponent,
  args: {
    step: {
      type: 'navigate',
      url: 'https://app-speed.dev/',
    } as never,
  },
  argTypes: {
    stepControl: {
      control: false,
      table: {
        disable: true,
      },
    },
  },
  render: ({ step }: AuditStepStoryArgs) => ({
    props: {
      stepControl: new StepFormGroup(step),
    },
  }),
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<AuditStepComponent & AuditStepStoryArgs>;

export default meta;
type Story = StoryObj<AuditStepComponent & AuditStepStoryArgs>;

export const Default: Story = {};
