import type { StorybookConfig } from '@storybook/angular';
import remarkGfm from 'remark-gfm';

export default {
  stories: [
    {
      directory: '../../../libs',
      files: '**/*.@(mdx|stories.@(js|jsx|ts|tsx))',
    },
  ],
  addons: [
    {
      name: 'storybook-design-token',
      options: {
        designTokenGlob: 'libs/ui/theme/**/*.{css,scss,less,svg,png,jpeg,gif}',
      },
    },
    {
      name: '@storybook/addon-docs',
      options: {
        // GitHub-flavoured Markdown, for the tables in the guidance pages.
        mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } },
      },
    },
  ],
  staticDirs: [{ from: '../../portal/src/assets', to: '/' }],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
} satisfies StorybookConfig;
