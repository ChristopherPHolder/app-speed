import '!style-loader!css-loader!sass-loader!./../src/token/reset.scss';
import '!style-loader!css-loader!sass-loader!./../src/token/color.scss';
import '!style-loader!css-loader!sass-loader!./../src/token/typography.scss';
import { applicationConfig, Preview } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';

const preview: Preview = {
  decorators: [
    applicationConfig({
      providers: [
        provideAnimations(),
      ]
    })
  ],
  parameters: {
    layout: 'fullscreen',
    designToken: {
      defaultTab: 'Colors',
    },
  }
};

export default preview;
