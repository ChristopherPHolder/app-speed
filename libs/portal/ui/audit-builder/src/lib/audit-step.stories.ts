import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
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

export const Default: Story = {
  render: () => {
    return {
      props: {
        stepControl: new StepFormGroup({ type: '' } as never),
      },
    };
  },
};
