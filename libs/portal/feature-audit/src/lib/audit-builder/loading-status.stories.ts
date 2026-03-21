import { signal } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { applicationConfig, componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { LoadingStatusComponent } from './loading-status.component';

const meta: Meta<LoadingStatusComponent> = {
  title: 'Patterns/Audit Builder/Loading Status',
  component: LoadingStatusComponent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Presentation-only dialog body for audit progress. The container derives the message and provides it through MAT_DIALOG_DATA.',
      },
    },
  },
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: signal({
            title: 'Loading Status Title',
            subtitle: 'Loading Status Subtitle',
            footerText: 'Loading Status Footer Text',
          }),
        },
      ],
    }),
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

export const Default: Story = {};
