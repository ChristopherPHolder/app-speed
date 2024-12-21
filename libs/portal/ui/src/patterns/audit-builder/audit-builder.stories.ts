import { Meta, StoryObj } from '@storybook/angular';
import { AuditBuilderComponent } from './audit-builder.component';

const meta: Meta<AuditBuilderComponent> = {
  title: 'Patterns/Audit Builder',
  component: AuditBuilderComponent,
};

export default meta;

type Story = StoryObj<AuditBuilderComponent>;

export const Default: Story = {};
