import { defineConfig } from 'vite';

import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/packages/conductor/is-online-ser',

  plugins: [nxViteTsPaths()],

  test: {
    watch: false,
    globals: true,
    cache: { dir: '../../../node_modules/.vitest/packages/conductor/is-online-ser' },
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: { reportsDirectory: '../../../coverage/packages/conductor/is-online-ser', provider: 'v8' },
  },
});
