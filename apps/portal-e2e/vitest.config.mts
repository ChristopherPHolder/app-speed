import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['apps/portal-e2e/visual-snapshots.spec.ts'] } });
