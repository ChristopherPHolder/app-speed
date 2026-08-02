/// <reference types="vitest" />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../../../node_modules/.vite/libs/convenience/trace/domain',
  plugins: [nxViteTsPaths()],
  test: {
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: { reportsDirectory: '../../../../coverage/libs/convenience/trace/domain', provider: 'v8' },
  },
});
