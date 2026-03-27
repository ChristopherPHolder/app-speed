import type { Meta, StoryObj } from '@storybook/angular';
import { STATUS } from '@app-speed/ui/status-badge';
import { ViewerStepDetailSectionComponent } from './viewer-step-detail-section.component';

const meta: Meta<ViewerStepDetailSectionComponent> = {
  title: 'Patterns/Viewer /Step Detail Section',
  component: ViewerStepDetailSectionComponent,
  parameters: {
    layout: 'padded',
  },
  args: {
    title: 'Diagnostics',
    description: 'Opportunities that can improve loading performance for this step.',
    items: [
      {
        id: 'render-blocking-resources',
        status: STATUS.WARN,
        title: 'Eliminate render-blocking resources',
        displayValue: 'Potential savings of 210 ms',
        description: 'Some stylesheet requests are delaying the initial render.',
        affectedMetrics: ['FCP'],
      },
    ],
    context: null,
  },
};

export default meta;
type Story = StoryObj<ViewerStepDetailSectionComponent>;

export const Default: Story = {};
