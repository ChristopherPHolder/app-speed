/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(() => ({
  resolve: {
    tsconfigPaths: true,
  },
  root: import.meta.dirname,
  cacheDir: '../../../../node_modules/.vite/libs/audit/core/domain',
  plugins: [viteStaticCopy({ targets: [{ src: '*.md', dest: '.' }] })],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [  ],
  // },
  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../../coverage/libs/audit/core/domain',
      provider: 'v8' as const,
    },
  },
}));
