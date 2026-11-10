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
      await client.execute('PRAGMA user_version = 4');
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
      expect((await client.execute('PRAGMA user_version')).rows[0]?.['user_version']).toBe(4);
    } finally {
      client.close();
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('upgrades version-one history without assigning its public runs to a project', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'sqlite-upgrade-'));
    const path = join(directory, 'audit.sqlite');
    const client = createClient({ url: `file:${path}` });
    try {
      await client.executeMultiple(`CREATE TABLE audit_runs(id TEXT PRIMARY KEY,created_at INTEGER);
        INSERT INTO audit_runs VALUES ('existing-public',1); PRAGMA user_version=1;`);
      await Effect.runPromise(
        Effect.gen(function* () {
          const db = yield* SqliteDbClient;
          expect(
            yield* db.run((current) =>
              current.all(sql`SELECT id,project_id,source,client_id,client_name FROM audit_runs`),
            ),
          ).toEqual([
            { id: 'existing-public', project_id: null, source: 'portal', client_id: null, client_name: null },
          ]);
        }).pipe(
          Effect.provide(SqliteDbClient.live),
          Effect.provideService(ConfigProvider.ConfigProvider, providePath(path)),
        ),
      );
      expect((await client.execute('PRAGMA user_version')).rows[0]?.['user_version']).toBe(3);
    } finally {
      client.close();
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('upgrades version-two history to portal-sourced runs and rejects unknown sources', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'sqlite-upgrade-source-'));
    const path = join(directory, 'audit.sqlite');
    const client = createClient({ url: `file:${path}` });
    try {
      await client.executeMultiple(`CREATE TABLE audit_runs(id TEXT PRIMARY KEY,created_at INTEGER,project_id TEXT);
        INSERT INTO audit_runs VALUES ('existing-project','1','project'); PRAGMA user_version=2;`);
      await Effect.runPromise(
        Effect.gen(function* () {
          const db = yield* SqliteDbClient;
          expect(yield* db.run((current) => current.all(sql`SELECT id,project_id,source FROM audit_runs`))).toEqual([
            { id: 'existing-project', project_id: 'project', source: 'portal' },
          ]);
          const invalid = yield* Effect.exit(
            db.run((current) => current.run(sql`INSERT INTO audit_runs (id, source) VALUES ('invalid', 'email')`)),
          );
          expect(invalid._tag).toBe('Failure');
        }).pipe(
          Effect.provide(SqliteDbClient.live),
          Effect.provideService(ConfigProvider.ConfigProvider, providePath(path)),
        ),
      );
      expect((await client.execute('PRAGMA user_version')).rows[0]?.['user_version']).toBe(3);
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
