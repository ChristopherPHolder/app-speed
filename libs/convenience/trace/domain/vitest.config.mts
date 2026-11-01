/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  root: import.meta.dirname,
  cacheDir: '../../../../node_modules/.vite/libs/convenience/trace/domain',
  plugins: [],
  test: {
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: { reportsDirectory: '../../../../coverage/libs/convenience/trace/domain', provider: 'v8' },
  },
});
