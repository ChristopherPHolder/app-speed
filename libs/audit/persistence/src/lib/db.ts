import fs from 'node:fs';
import path from 'node:path';
import SqliteDatabase from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { Config, Context, Data, Effect, Layer } from 'effect';
import { schema } from './schema';

const MIGRATION_TABLE_NAME = '__app_speed_migrations';

export class QueryError extends Data.TaggedError('QueryError')<{
  message: string;
  cause?: unknown;
}> {}

export type DbClientDatabase = BetterSQLite3Database<typeof schema>;

const resolveSqliteFile = (databaseUrl: string) => {
  if (databaseUrl.startsWith('file:')) {
    const filePath = databaseUrl.slice('file:'.length);
    return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  }

  if (path.isAbsolute(databaseUrl)) {
    return databaseUrl;
  }

  return path.resolve(process.cwd(), databaseUrl);
};

const collectMigrationFiles = (migrationsRoot: string): string[] =>
  fs
    .readdirSync(migrationsRoot, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(migrationsRoot, entry.name);

      if (entry.isDirectory()) {
        return collectMigrationFiles(fullPath);
      }

      if (entry.isFile() && entry.name.endsWith('.sql')) {
        return [fullPath];
      }

      return [];
    })
    .sort((left, right) => left.localeCompare(right));

const resolveMigrationsDir = (cwd: string): string | null => {
  const configured = process.env['DATABASE_MIGRATIONS_DIR'];
  const candidatePaths = [
    configured ? path.resolve(cwd, configured) : null,
    path.resolve(cwd, 'migrations'),
    path.resolve(cwd, 'libs/audit/persistence/migrations'),
  ].filter((candidate): candidate is string => candidate !== null);

  const found = candidatePaths.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isDirectory());
  return found ?? null;
};

const applyMigrations = (client: SqliteDatabase.Database, migrationsDir: string): number => {
  const migrationFiles = collectMigrationFiles(migrationsDir);
  if (migrationFiles.length === 0) {
    return 0;
  }

  client.exec(
    `CREATE TABLE IF NOT EXISTS "${MIGRATION_TABLE_NAME}" ("name" TEXT NOT NULL PRIMARY KEY, "createdAt" INTEGER NOT NULL)`,
  );
  const appliedMigrations = new Set(
    (client.prepare(`SELECT name FROM "${MIGRATION_TABLE_NAME}"`).all() as Array<{ name: string }>).map(
      (row) => row.name,
    ),
  );
  const insertMigration = client.prepare(`INSERT INTO "${MIGRATION_TABLE_NAME}" ("name", "createdAt") VALUES (?, ?)`);

  let appliedCount = 0;
  for (const migrationFile of migrationFiles) {
    const migrationName = path.relative(migrationsDir, migrationFile).replace(/\\/g, '/');
    if (appliedMigrations.has(migrationName)) {
      continue;
    }

    const migrationSql = fs.readFileSync(migrationFile, 'utf8');
    const applyMigration = client.transaction((name: string, sql: string) => {
      client.exec(sql);
      insertMigration.run(name, Date.now());
    });
    applyMigration(migrationName, migrationSql);
    appliedCount += 1;
  }

  return appliedCount;
};

export class DbClient extends Context.Tag('DbClient')<
  DbClient,
  {
    readonly run: <A>(f: (db: DbClientDatabase) => A) => Effect.Effect<A, QueryError>;
  }
>() {
  static live = Layer.scoped(
    DbClient,
    Effect.acquireRelease(
      Effect.gen(function* () {
        const databaseUrl = yield* Config.string('DATABASE_URL').pipe(Config.withDefault('file:./tmp/dev.db'));
        const sqliteFile = resolveSqliteFile(databaseUrl);
        const migrationsDir = resolveMigrationsDir(process.cwd());
        fs.mkdirSync(path.dirname(sqliteFile), { recursive: true });
        const client = new SqliteDatabase(sqliteFile);
        client.pragma('foreign_keys = ON');
        client.pragma('journal_mode = WAL');
        if (migrationsDir) {
          const appliedMigrations = applyMigrations(client, migrationsDir);
          yield* Effect.logInfo(
            `Applied ${appliedMigrations} migration(s) from ${migrationsDir} for ${sqliteFile}`,
          );
        } else {
          yield* Effect.logWarning(`No migration directory found from ${process.cwd()}; skipping migrations.`);
        }
        const db = drizzle(client, { schema });

        yield* Effect.logInfo(`Initialize DB from ${databaseUrl} resolved to ${sqliteFile}`);

        const withDatabaseError = <A>(operation: () => A): Effect.Effect<A, QueryError> =>
          Effect.try({
            try: operation,
            catch: (error) => new QueryError({ message: 'Database operation failed', cause: error }),
          });

        const run = <A>(f: (currentDb: DbClientDatabase) => A) => withDatabaseError(() => f(db));

        return { client, run };
      }),
      ({ client }) => Effect.sync(() => client.close()).pipe(Effect.orDie),
    ).pipe(Effect.map(({ run }) => ({ run }))),
  );
}
