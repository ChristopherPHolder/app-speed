import { createClient } from '@libsql/client';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';
import { ConfigProvider, Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { SqliteDbClient } from './sqlite-db';

const providePath = (path: string) => ConfigProvider.fromUnknown({ SQLITE_PATH: path });

describe('SQLite database boundaries', () => {
  it('rejects newer database formats without resetting their version', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'sqlite-version-'));
    const path = join(directory, 'audit.sqlite');
    const client = createClient({ url: `file:${path}` });
    try {
      await client.execute('PRAGMA user_version = 2');
      const exit = await Effect.runPromiseExit(
        Effect.scoped(
          Effect.gen(function* () {
            yield* SqliteDbClient;
          }),
        ).pipe(
          Effect.provide(SqliteDbClient.live),
          Effect.provideService(ConfigProvider.ConfigProvider, providePath(path)),
        ),
      );
      expect(exit._tag).toBe('Failure');
      expect((await client.execute('PRAGMA user_version')).rows[0]?.['user_version']).toBe(2);
    } finally {
      client.close();
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('enforces foreign keys and rolls back incomplete transactions', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'sqlite-constraints-'));
    try {
      await Effect.runPromise(
        Effect.gen(function* () {
          const db = yield* SqliteDbClient;
          const invalid = yield* Effect.exit(
            db.run((client) =>
              client.run(sql`
          INSERT INTO audit_runs (id, template_id, created_at, updated_at) VALUES ('invalid', 'missing', 1, 1)`),
            ),
          );
          expect(invalid._tag).toBe('Failure');
          const rolledBack = yield* Effect.exit(
            db.run((client) =>
              client.transaction(async (tx) => {
                await tx.run(sql`INSERT INTO records (key, value) VALUES ('rollback', 'temporary')`);
                await tx.run(sql`INSERT INTO records (key, value) VALUES ('rollback', 'duplicate')`);
              }),
            ),
          );
          expect(rolledBack._tag).toBe('Failure');
          expect(yield* db.run((client) => client.all(sql`SELECT * FROM records WHERE key='rollback'`))).toEqual([]);
        }).pipe(
          Effect.provide(SqliteDbClient.live),
          Effect.provideService(ConfigProvider.ConfigProvider, providePath(join(directory, 'audit.sqlite'))),
        ),
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
