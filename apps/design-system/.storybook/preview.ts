import { applicationConfig, componentWrapperDecorator, type Preview } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';

const preview: Preview = {
  decorators: [
    applicationConfig({
      providers: [provideAnimations()],
    }),
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
