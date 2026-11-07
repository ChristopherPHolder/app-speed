import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: [
    './libs/audit/core/persistence/src/lib/sqlite-schema.ts',
    './libs/audit/user-flow/persistence/src/lib/sqlite-schema.ts',
  ],
  out: './apps/api/sqlite-migrations',
  dialect: 'sqlite',
  dbCredentials: { url: process.env.SQLITE_PATH ?? '.data/app-speed.sqlite' },
  verbose: true,
  strict: true,
});
