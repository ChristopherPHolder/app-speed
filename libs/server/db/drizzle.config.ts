import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './libs/server/db/src/lib/schema.ts',
  out: './libs/server/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'file:./tmp/dev.db',
  },
  verbose: true,
  strict: true,
});
