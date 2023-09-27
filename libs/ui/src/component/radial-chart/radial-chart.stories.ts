import { Meta, StoryObj } from '@storybook/angular';
import { RadialChartComponent } from './radial-chart.component';
import { RADIAL_CHART_SIZE } from './radial-chart.types';

const sizeOptions = Object.values(RADIAL_CHART_SIZE);

const meta: Meta<RadialChartComponent> = {
  title: 'Radial Chart',
  component: RadialChartComponent,
  argTypes: {
    score: {
      description: 'Score of the category displayed in the radial chart',
      control: {
        type: 'number',
        min: 0,
        max: 100,
      },
      defaultValue: 0,
    },
    size: {
      description: 'Size of the radial chart with options of small, medium and large',
      options: sizeOptions,
      control: { type: 'select' },
    }
  }
};
export default meta;

type Story = StoryObj<RadialChartComponent>;

export const Default: Story = {};
export const Poor: Story = { args: { score: 49 }};
export const NeedsImprovement: Story = { args: { score: 89 }};
export const Good: Story = { args: { score: 100 }};
export const Small: Story = { args: { size: RADIAL_CHART_SIZE.SMALL }};
export const Medium: Story = { args: { size: RADIAL_CHART_SIZE.MEDIUM }};
export const Large: Story = { args: { size: RADIAL_CHART_SIZE.LARGE }};
