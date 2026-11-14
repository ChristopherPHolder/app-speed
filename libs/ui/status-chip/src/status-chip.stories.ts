import type { Meta, StoryObj } from '@storybook/angular';
import { StatusChipComponent } from './status-chip.component';

const meta: Meta<StatusChipComponent> = {
  title: 'Components/Status chip',
  component: StatusChipComponent,
  argTypes: {
    tone: { control: { type: 'inline-radio' }, options: ['neutral', 'info', 'success', 'warning', 'error'] },
  },
  args: { tone: 'success', icon: 'check', busy: false },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A read-only status label. Choose the tone by meaning: `success` for passed or completed, `warning` for ' +
          'needs attention, `error` for failed, `info` for in progress, `neutral` for queued or not applicable. ' +
          'Always give it a text label; add an icon, or `busy` for work in progress, so status never depends on ' +
          'colour alone. It is not interactive — use a Material chip for filters and a button for actions.',
      },
    },
  },
  render: (args) => ({
    props: args,
    template: `<ui-status-chip [tone]="tone" [icon]="icon" [busy]="busy">Succeeded</ui-status-chip>`,
  }),
};

export default meta;
type Story = StoryObj<StatusChipComponent>;

export const Default: Story = {};

/** Every tone with the icon that usually goes with it. */
export const Tones: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px;">
        <ui-status-chip tone="neutral" icon="schedule">Queued</ui-status-chip>
        <ui-status-chip tone="info" [busy]="true">Running</ui-status-chip>
        <ui-status-chip tone="success" icon="check">Succeeded</ui-status-chip>
        <ui-status-chip tone="warning" icon="warning">Needs attention</ui-status-chip>
        <ui-status-chip tone="error" icon="close">Failed</ui-status-chip>
      </div>
    `,
  }),
};

/** Without an icon, for dense rows where the label is enough. */
export const LabelOnly: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px;">
        <ui-status-chip>User flow</ui-status-chip>
        <ui-status-chip tone="info">via Claude</ui-status-chip>
        <ui-status-chip tone="warning">Experimental</ui-status-chip>
      </div>
    `,
  }),
};
