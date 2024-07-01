/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/esbuild-meta/e2e',

  plugins: [nxViteTsPaths()],

  test: {
    watch: false,
    reporters: ['default'],
    globals: true,
    cache: { dir: '../../node_modules/.vitest' },
    environment: 'node',
    include: ['e2e/**/*.test.e2e.ts'],
    globalSetup: '../../global-setup.e2e.ts'
  },
});
