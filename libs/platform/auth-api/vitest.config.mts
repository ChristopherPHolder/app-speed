import { defineConfig } from 'vitest/config';
export default defineConfig({
  root: import.meta.dirname,
  resolve: { tsconfigPaths: true },
  test: { name: 'platform-auth-api', environment: 'node', watch: false, include: ['src/**/*.spec.ts'] },
});
