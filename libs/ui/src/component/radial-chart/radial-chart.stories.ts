import { Meta, Story } from '@storybook/angular';
import { RadialChartComponent } from './radial-chart.component';

export default {
  title: 'Radial Chart',
  component: RadialChartComponent
}as Meta<RadialChartComponent>;

const Template: Story = (args) => ({
  props: args,
});

export const Green = Template.bind({});
Green.args = { score: 100 };

export const Orange = Template.bind({});
Orange.args = { score: 89 };

export const Red = Template.bind({});
Red.args = { score: 49 };
