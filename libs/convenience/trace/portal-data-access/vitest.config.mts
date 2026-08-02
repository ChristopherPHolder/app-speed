/// <reference types="vitest" />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../../../node_modules/.vite/libs/convenience/trace/portal-data-access',
  plugins: [nxViteTsPaths()],
  test: { watch: false, globals: true, environment: 'jsdom', include: ['src/**/*.spec.ts'] },
});
