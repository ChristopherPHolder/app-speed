import { defineConfig } from 'prisma/config';

const normalizeDbUrl = (filePath: string) => (filePath.startsWith('file:') ? filePath : `file:${filePath}`);
const dbFile = process.env.DB_FILE ?? process.env.DATABASE_URL ?? 'file:./tmp/dev.db';

export default defineConfig({
  schema: 'src/prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    url: normalizeDbUrl(dbFile),
  },
});
