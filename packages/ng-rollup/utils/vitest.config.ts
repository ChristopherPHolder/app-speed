import { defineConfig } from 'vite';

import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/packages/ng-rollup/utils',

  plugins: [nxViteTsPaths()],

  test: {
    watch: true,
    globals: true,
    pool: 'forks',
    cache: { dir: '../../../node_modules/.vitest' },
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: { reportsDirectory: '../../../coverage/packages/ng-rollup/utils', provider: 'v8' },
  },
});
