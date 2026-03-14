import type { Meta, StoryObj } from '@storybook/angular';
import { STATUS } from '@app-speed/portal-ui/status-badge';
import { MetricSummary, ViewerStepMetricSummaryComponent } from './viewer-step-metric-summary.component';

const metricSummary: MetricSummary[] = [
  {
    name: 'Performance',
    value: '0.94',
    description: 'The page remains responsive during the primary user flow.',
    status: STATUS.PASS,
  },
  {
    name: 'Accessibility',
    value: '0.81',
    description: 'A few color contrast and landmark issues still need attention.',
    status: STATUS.WARN,
  },
  {
    name: 'SEO',
    value: '0.67',
    description: 'Some metadata and crawlability checks are currently missing.',
    status: STATUS.ALERT,
  },
  {
    name: 'Best Practices',
    value: '0.89',
    description: 'Core platform checks are mostly healthy for this step.',
    status: STATUS.INFO,
  },
];

const meta: Meta<ViewerStepMetricSummaryComponent> = {
  title: 'Patterns/Viewer /Metrics',
  component: ViewerStepMetricSummaryComponent,
  parameters: {
    layout: 'padded',
  },
  args: {
    metricSummary,
  },
};

export default meta;
type Story = StoryObj<ViewerStepMetricSummaryComponent>;

export const Default: Story = {};
