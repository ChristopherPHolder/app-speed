import { signal } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { applicationConfig, componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { LoadingStatusComponent } from './loading-status.component';

const meta: Meta<LoadingStatusComponent> = {
  title: 'Patterns/Audit Builder/Loading Status',
  component: LoadingStatusComponent,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `
        <div
          style="
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 32px;
            background:
              radial-gradient(circle at top, rgba(219, 234, 254, 0.9), transparent 40%),
              linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
          "
        >
          <div style="width: min(100%, 440px);">
            ${story}
          </div>
        </div>
      `,
    ),
  ],
};

export default meta;
type Story = StoryObj<LoadingStatusComponent>;

export const Submitting: Story = {
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: signal({
            title: 'Submitting Audit',
            subtitle: 'Submitting an audit request to server',
          }),
        },
      ],
    }),
  ],
};

export const Queued: Story = {
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: signal({
            title: 'Audit queued',
            subtitle: '2 audits are ahead in queue. Audit ID: audit-4b9f4f6d',
          }),
        },
      ],
    }),
  ],
};

export const Running: Story = {
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: signal({
            title: 'Audit running',
            subtitle: 'A runner has started your audit. Results will open automatically when it completes. Audit ID: audit-4b9f4f6d',
          }),
        },
      ],
    }),
  ],
};
