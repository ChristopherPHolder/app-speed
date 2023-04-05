import { Meta, Story } from '@storybook/angular';
import { RadialChartComponent } from './radial-chart.component';

export default {
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
    },
  }
}as Meta<RadialChartComponent>;

const Template: Story = (args) => ({
  props: args,
});

export const Default = Template.bind({});
