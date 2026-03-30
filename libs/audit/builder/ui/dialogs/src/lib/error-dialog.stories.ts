import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { applicationConfig, componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { ErrorDialog } from './error-dialog';
import type { ErrorDialogModel } from './error-dialog.model';

const DEFAULT_DIALOG_DATA: ErrorDialogModel = {
  title: 'Request Failed',
  message: 'Error: validation failed\n  at submitAuditRequest (/audit/builder/feature)\n  at effect (builder.effects.ts:42)',
};

const meta: Meta<ErrorDialog> = {
  title: 'Patterns/Audit Builder/Error Dialog',
  component: ErrorDialog,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Presentation-only dialog body for audit request failures.',
      },
    },
  },
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: DEFAULT_DIALOG_DATA,
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
              radial-gradient(circle at top, rgba(254, 226, 226, 0.92), transparent 40%),
              linear-gradient(180deg, #fff7ed 0%, #f8fafc 100%);
          "
        >
          <div style="width: min(100%, 640px);">
            ${story}
          </div>
        </div>
      `,
    ),
  ],
};

export default meta;
type Story = StoryObj<ErrorDialog>;

export const Default: Story = {};
