import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './libs/audit/persistence/src/lib/schema.ts',
  out: './libs/audit/persistence/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'file:./tmp/dev.db',
  },
  verbose: true,
  strict: true,
});
