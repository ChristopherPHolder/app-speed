import { componentWrapperDecorator, type Preview } from '@storybook/angular';

const preview: Preview = {
  globalTypes: {
    scheme: {
      description: 'Colour scheme the tokens resolve in',
      toolbar: {
        title: 'Scheme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    scheme: 'light',
  },
  decorators: [
    (story, context) => {
      // The theme emits `light-dark()` colours, so the scheme is switched on the root element.
      document.documentElement.style.colorScheme = context.globals['scheme'] === 'dark' ? 'dark' : 'light';
      return story();
    },
    // In dark, a story paints its own surface so it stays legible on the light docs page.
    componentWrapperDecorator(
      (story) =>
        `<div class="mat-typography" style="background: light-dark(transparent, var(--mat-sys-surface)); color: var(--mat-sys-on-surface);">${story}</div>`,
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    designToken: {
      defaultTab: 'Colors',
    },
    options: {
      storySort: {
        order: [
          'Foundations',
          [
            'Overview',
            'Color',
            'Typography',
            'Shape',
            'Elevation',
            'Layout',
            'Motion',
            'States',
            'Iconography',
            'Content',
            'Accessibility',
          ],
          'Material',
          'Components',
          'Patterns',
        ],
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;
