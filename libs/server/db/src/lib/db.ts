import fs from 'node:fs';
import path from 'node:path';
import SqliteDatabase from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { Config, Context, Data, Effect, Layer } from 'effect';
import { schema } from './schema';

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
        fs.mkdirSync(path.dirname(sqliteFile), { recursive: true });
        const client = new SqliteDatabase(sqliteFile);
        client.pragma('foreign_keys = ON');
        client.pragma('journal_mode = WAL');
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
