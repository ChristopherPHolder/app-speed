import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  resolve: { tsconfigPaths: true },
  test: {
    name: 'soft-navigation-browser',
    include: ['integration/**/*.spec.ts'],
    environment: 'node',
    testTimeout: 60_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
});
