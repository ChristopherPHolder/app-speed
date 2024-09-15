import { defineConfig } from 'vite';

import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/packages/conductor/shared-util-lib',

  plugins: [nxViteTsPaths()],

  test: {
    passWithNoTests: true,
    watch: false,
    globals: true,
    cache: { dir: '../../../node_modules/.vitest/packages/conductor/shared-util-lib' },
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: { reportsDirectory: '../../../coverage/packages/conductor/shared-util-lib', provider: 'v8' },
  },
});
