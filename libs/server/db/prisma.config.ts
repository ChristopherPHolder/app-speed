import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'libs/server/db/src/prisma/schema.prisma',
  migrations: { path: 'libs/server/db/prisma/migrations' },
  datasource: {
    url: 'file:../../../tmp/dev.db',
  },
});
