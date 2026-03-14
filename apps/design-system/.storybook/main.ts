import type { StorybookConfig } from '@storybook/angular';

export default {
  stories: ['../../../{apps,libs}/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['storybook-design-token', '@storybook/addon-docs'],
  staticDirs: [{ from: '../../portal/src/assets', to: '/' }],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
} satisfies StorybookConfig;
