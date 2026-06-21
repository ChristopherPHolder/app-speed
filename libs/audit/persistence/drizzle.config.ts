import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './libs/audit/persistence/src/lib/schema.ts',
  out: './libs/audit/persistence/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL ?? '',
  },
  verbose: true,
  strict: true,
});
