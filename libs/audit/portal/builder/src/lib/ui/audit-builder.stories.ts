import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { provideAuditBuilderIcons } from './audit-builder-icons.provider';
import { DEFAULT_AUDIT_DETAILS } from '@app-speed/audit/model';
import { AuditBuilderComponent } from './audit-builder.component';

const meta: Meta<AuditBuilderComponent> = {
  title: 'Patterns/Audit Builder',
  component: AuditBuilderComponent,
  decorators: [applicationConfig({ providers: [provideAuditBuilderIcons()] })],
};

export default meta;
type Story = StoryObj<AuditBuilderComponent>;

export const Default: Story = {
  args: {
    initialAudit: DEFAULT_AUDIT_DETAILS,
    modifying: true,
  },
};
