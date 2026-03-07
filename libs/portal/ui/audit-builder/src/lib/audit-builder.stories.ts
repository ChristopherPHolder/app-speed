import type { Meta, StoryObj } from '@storybook/angular';
import { DEFAULT_AUDIT_DETAILS } from '@app-speed/shared-user-flow-replay';
import { AuditBuilderComponent } from './audit-builder.component';

const meta: Meta<AuditBuilderComponent> = {
  title: 'Patterns/Audit Builder',
  component: AuditBuilderComponent,
};

export default meta;
type Story = StoryObj<AuditBuilderComponent>;

export const Default: Story = {
  args: {
    initialAudit: DEFAULT_AUDIT_DETAILS,
    modifing: true,
  },
};
