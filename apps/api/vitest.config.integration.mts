import { defineConfig } from 'vitest/config';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(() => ({
  resolve: { tsconfigPaths: true },
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/api-integration',
  plugins: [viteStaticCopy({ targets: [{ src: '*.md', dest: '.' }] })],
  test: {
    name: 'api-integration',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['integration/**/*.{integration,test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/api',
      provider: 'v8' as const,
    },
  },
}));
