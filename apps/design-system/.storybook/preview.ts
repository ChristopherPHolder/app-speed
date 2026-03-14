import { componentWrapperDecorator, type Preview } from '@storybook/angular';

const preview: Preview = {
  decorators: [
    componentWrapperDecorator((story) => `<div class="mat-typography">${story}</div>`),
  ],
  parameters: {
    layout: 'fullscreen',
    designToken: {
      defaultTab: 'Colors',
    },
  },
  tags: ['autodocs'],
};

export default preview;
