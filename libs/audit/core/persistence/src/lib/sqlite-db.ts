import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { Config, Context, Effect, Layer, Schedule } from 'effect';
import { QueryError } from './db';
import { schema } from './sqlite-schema';

export class SqliteDbClient extends Context.Service<
  SqliteDbClient,
  {
    readonly run: <A>(f: (db: LibSQLDatabase<typeof schema>) => A | Promise<A>) => Effect.Effect<A, QueryError>;
  }
>()('SqliteDbClient') {
  static live = Layer.effect(SqliteDbClient)(
    Effect.gen(function* () {
      const path = yield* Config.String('SQLITE_PATH').pipe(Config.withDefault('.data/app-speed.sqlite'));
      if (path.includes('://') || path.startsWith('file:')) {
        return yield* Effect.fail(new QueryError({ message: 'SQLITE_PATH must be a local filesystem path.' }));
      }
      const client = yield* Effect.acquireRelease(
        Effect.tryPromise({
          try: async () => {
            await mkdir(dirname(resolve(path)), { recursive: true });
            return createClient({ url: pathToFileURL(resolve(path)).href });
          },
          catch: (cause) => new QueryError({ message: 'Cannot open SQLite database', cause }),
        }),
        (client) => Effect.sync(() => client.close()),
      );
      yield* Effect.tryPromise({
        try: async () => {
          await client.execute('PRAGMA foreign_keys = ON');
          await client.execute('PRAGMA journal_mode = WAL');
          await client.execute('PRAGMA busy_timeout = 5000');
          const version = await client.execute('PRAGMA user_version');
          const currentVersion = Number(version.rows[0]?.['user_version'] ?? 0);
          if (currentVersion > 2) throw new Error(`Unsupported SQLite schema version ${currentVersion}`);
          if (currentVersion === 2) return;
          if (currentVersion === 1) {
            const transaction = await client.transaction('write');
            try {
              // Another API/runner process may have upgraded while this connection waited for the lock.
              const version = await transaction.execute('PRAGMA user_version');
              if (Number(version.rows[0]?.['user_version']) === 1) {
                await transaction.execute('ALTER TABLE audit_runs ADD COLUMN project_id TEXT');
                await transaction.execute(
                  'CREATE INDEX audit_runs_project_history_idx ON audit_runs(project_id, created_at, id)',
                );
                await transaction.execute('PRAGMA user_version = 2');
              }
              await transaction.commit();
            } catch (cause) {
              await transaction.rollback();
              throw cause;
            } finally {
              transaction.close();
            }
            return;
          }
          await client.executeMultiple(`
          BEGIN IMMEDIATE;
          CREATE TABLE IF NOT EXISTS audit_templates (
            id TEXT PRIMARY KEY NOT NULL, kind TEXT NOT NULL, title TEXT NOT NULL,
            created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
          CREATE TABLE IF NOT EXISTS audit_runs (
            id TEXT PRIMARY KEY NOT NULL, template_id TEXT NOT NULL REFERENCES audit_templates(id) ON UPDATE CASCADE,
            status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK(status IN ('SCHEDULED','IN_PROGRESS','COMPLETE')),
            created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, started_at INTEGER, completed_at INTEGER,
            duration_ms INTEGER, project_id TEXT);
          CREATE INDEX IF NOT EXISTS audit_runs_project_history_idx ON audit_runs(project_id, created_at, id);
          CREATE INDEX IF NOT EXISTS audit_runs_scheduled_queue_idx ON audit_runs(status, created_at, id);
          CREATE TABLE IF NOT EXISTS audit_results (
            id TEXT PRIMARY KEY NOT NULL, run_id TEXT NOT NULL UNIQUE REFERENCES audit_runs(id) ON UPDATE CASCADE,
            status TEXT NOT NULL CHECK(status IN ('SUCCESS','FAILURE')), error TEXT, created_at INTEGER NOT NULL);
          CREATE TABLE IF NOT EXISTS user_flow_audit_templates (
            template_id TEXT PRIMARY KEY NOT NULL REFERENCES audit_templates(id) ON DELETE CASCADE ON UPDATE CASCADE,
            definition TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS user_flow_audit_results (
            result_id TEXT PRIMARY KEY NOT NULL REFERENCES audit_results(id) ON DELETE CASCADE ON UPDATE CASCADE,
            flow_result_record_key TEXT NOT NULL, report_html_record_key TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS records (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
          PRAGMA user_version = 2;
          COMMIT;
        `);
        },
        catch: (cause) => new QueryError({ message: 'Cannot initialize SQLite schema', cause }),
      });
      const db = drizzle(client, { schema });
      return {
        run: <A>(f: (db: LibSQLDatabase<typeof schema>) => A | Promise<A>) =>
          Effect.tryPromise({
            try: () => Promise.resolve(f(db)),
            catch: (cause) => new QueryError({ message: 'SQLite operation failed', cause }),
          }).pipe(
            Effect.retry({
              times: 8,
              schedule: Schedule.exponential('10 millis'),
              while: (error) => isBusy(error.cause),
            }),
          ),
      };
    }),
  );
}

// libsql may replace its connection after transactions, resetting busy_timeout.
// Retry the entire operation so failed write transactions are rolled back first.
const isBusy = (cause: unknown): boolean => {
  if (typeof cause !== 'object' || cause === null) return false;
  if ('code' in cause && (cause.code === 'SQLITE_BUSY' || cause.code === 'SQLITE_LOCKED')) return true;
  return 'cause' in cause && isBusy(cause.cause);
};
