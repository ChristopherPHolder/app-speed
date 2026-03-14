import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../../../{apps,libs}/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['storybook-design-token', '@storybook/addon-docs'],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
};

export default config;
