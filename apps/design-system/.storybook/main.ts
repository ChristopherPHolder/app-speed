import type { StorybookConfig } from '@storybook/angular';

export default {
  stories: [
    {
      directory: '../../../libs',
      files: '**/*.stories.@(js|jsx|ts|tsx)',
    },
  ],
  addons: [
    {
      name: 'storybook-design-token',
      options: {
        designTokenGlob: 'libs/ui/theme/**/*.{css,scss,less,svg,png,jpeg,gif}',
      },
    },
    '@storybook/addon-docs',
  ],
  staticDirs: [{ from: '../../portal/src/assets', to: '/' }],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
} satisfies StorybookConfig;
