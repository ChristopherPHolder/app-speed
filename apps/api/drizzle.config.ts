import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './apps/api/src/db/schema.ts',
  out: './apps/api/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL ?? '',
  },
  verbose: true,
  strict: true,
});
