import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/audit/lighthouse-plugin-soft-navigation',
  test: {
    name: 'lighthouse-plugin-soft-navigation',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/audit/lighthouse-plugin-soft-navigation',
      provider: 'v8',
    },
  },
});
