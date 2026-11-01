/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  root: import.meta.dirname,
  cacheDir: '../../../../node_modules/.vite/libs/convenience/trace/portal-data-access',
  plugins: [],
  test: { watch: false, globals: true, environment: 'jsdom', include: ['src/**/*.spec.ts'] },
});
