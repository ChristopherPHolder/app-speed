/// <reference types="vitest" />
import { defineConfig } from 'vite';

import viteTsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  cacheDir: '../../../node_modules/.vite/user-flow-replay',

  plugins: [
    viteTsConfigPaths({
      root: '../../../',
    }),
  ],

  test: {
    reporters: ['default'],
    globals: true,
    cache: {
      dir: '../../../node_modules/.vitest',
    },
    pool: 'threads',
    poolOptions: { threads: { singleThread: true } },
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
});
