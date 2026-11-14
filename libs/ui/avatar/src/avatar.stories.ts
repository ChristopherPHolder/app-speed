import type { Meta, StoryObj } from '@storybook/angular';
import { AvatarComponent } from './avatar.component';

const meta: Meta<AvatarComponent> = {
  title: 'Components/Avatar',
  component: AvatarComponent,
  argTypes: {
    size: { control: { type: 'inline-radio' }, options: ['small', 'medium', 'large'] },
  },
  args: { name: 'Holder', image: null, size: 'medium' },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Identifies a workspace, project or person. It shows the image when there is one and the first letter of ' +
          'the name otherwise. It is decorative (`aria-hidden`), so always show the name next to it. Use `small` ' +
          'in menus and dense lists, `medium` in navigation, and `large` in settings.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<AvatarComponent>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; align-items: center;">
        <ui-avatar name="Holder" size="small" />
        <ui-avatar name="Holder" size="medium" />
        <ui-avatar name="Holder" size="large" />
      </div>
    `,
  }),
};

export const WithImage: Story = {
  args: { image: '/logo.svg', size: 'large' },
};
