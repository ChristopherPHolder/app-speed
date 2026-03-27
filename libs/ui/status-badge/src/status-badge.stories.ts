import type { Meta, StoryObj } from '@storybook/angular';
import { STATUS } from './status-badge.constants';
import { StatusBadgeComponent } from './status-badge.component';

const statusOptions = Object.values(STATUS);

const meta: Meta<StatusBadgeComponent> = {
  title: 'Components/Status Badge',
  component: StatusBadgeComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    status: {
      control: { type: 'select' },
      options: statusOptions,
    },
  },
  args: {
    status: STATUS.INFO,
  },
};

export default meta;
type Story = StoryObj<StatusBadgeComponent>;

export const Default: Story = {};

export const AllStates: Story = {
  render: () => ({
    props: {
      statuses: statusOptions,
    },
    template: `
        @for (status of statuses; track status) {
          <div
            style="
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 12px 14px;
              border: 1px solid var(--mat-sys-outline);
              border-radius: 12px;
              background: var(--mat-sys-surface);
              color: var(--mat-sys-on-surface);
            "
          >
            <ui-status-badge [status]="status" />
            <span style="text-transform: capitalize;">{{ status }}</span>
          </div>
        }
    `,
  }),
};
