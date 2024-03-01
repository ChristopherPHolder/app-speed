import { Meta, StoryObj } from '@storybook/angular';
import { ShellComponent } from './shell.component';

const meta: Meta = {
  title: 'Pattern/Shell',
  component: ShellComponent,
}
export default meta;
type Story = StoryObj<ShellComponent>;

export const Default: Story = {
  args: {
    navItems: [
      'Nav 1',
      'Nav 2',
      'Nav 3'
    ]
  }
}
