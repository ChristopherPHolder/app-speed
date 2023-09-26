import { Meta, StoryObj } from '@storybook/angular';
import { RadialChartComponent } from './radial-chart.component';

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
      options: ['sm', 'md', 'lg'],
      control: { type: 'select' },
      defaultValue: 'md',
    }
  }
};
export default meta;

type Story = StoryObj<RadialChartComponent>;

export const Default: Story = {};

export const Poor: Story = { args: { score: 49 }};
export const NeedsImprovement: Story = { args: { score: 89 }};
export const Good: Story = { args: { score: 100 }};
export const Small: Story = { args: { size: 'sm' }};
export const Medium: Story = { args: { size: 'md' }};
export const Big: Story = { args: { size: 'lg' }};
