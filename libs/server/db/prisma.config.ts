import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'src/prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    url: 'file:./tmp/dev.db',
  },
});
