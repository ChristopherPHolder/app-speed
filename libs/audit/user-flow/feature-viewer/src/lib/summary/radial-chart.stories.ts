import type { Meta, StoryObj } from '@storybook/angular';
import { RadialChartComponent } from './radial-chart.component';
import { RADIAL_CHART_SIZE } from './radial-chart.types';

const sizeOptions = Object.values(RADIAL_CHART_SIZE);

const meta: Meta<RadialChartComponent> = {
  title: 'Patterns/Audit Summary/Radial Chart',
  component: RadialChartComponent,
  argTypes: {
    score: {
      description: 'Score of the category displayed in the radial chart',
      control: {
        TYPE: 'number',
        min: 0,
        max: 100,
      },
      defaultValue: 0,
    },
    size: {
      description: 'Size of the radial chart with options of small, medium and large',
      options: sizeOptions,
      control: { TYPE: 'select' },
    },
  },
};

export default meta;

type Story = StoryObj<RadialChartComponent>;

export const Default: Story = {};
export const Poor: Story = { args: { score: 49 } };
export const NeedsImprovement: Story = { args: { score: 89 } };
export const Good: Story = { args: { score: 100 } };
export const Small: Story = { args: { size: RADIAL_CHART_SIZE.SMALL } };
export const Medium: Story = { args: { size: RADIAL_CHART_SIZE.MEDIUM } };
export const Large: Story = { args: { size: RADIAL_CHART_SIZE.LARGE } };

/** Compare score bands at every size; switch the toolbar scheme to check dark. */
export const ScoreBands: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: var(--ui-space-6); padding: var(--ui-space-4);">
        @for (size of sizes; track size) {
          <div style="display: flex; align-items: center; gap: var(--ui-space-6);">
            @for (score of scores; track score) {
              <ui-radial-chart [score]="score" [size]="size" />
            }
          </div>
        }
      </div>
    `,
    props: { sizes: sizeOptions, scores: [25, 75, 97] },
  }),
};
