import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      '{apps,libs,tools}/**/vite.config.{mjs,js,ts,mts}',
      '{apps,libs,tools}/**/vitest.config.{mjs,js,ts,mts}',
      '!libs/audit/core/persistence/vite.config.ts',
      '!vitest.config.mts',
    ],
  },
});
