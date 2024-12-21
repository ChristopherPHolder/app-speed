import type { Meta, StoryObj } from '@storybook/angular';
import { FractionalResultChipComponent } from './fractional-result-chip.component';

const meta: Meta<FractionalResultChipComponent> = {
  title: 'Components/Fractional Result Chip',
  component: FractionalResultChipComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<FractionalResultChipComponent>;

export const Default: Story = {
  args: {
    results: {
      numPassed: 1,
      numPassableAudits: 1,
      numInformative: 1,
      totalWeight: 1,
    },
  },
};
