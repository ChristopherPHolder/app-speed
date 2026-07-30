import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Config, Context, Data, Effect, Layer } from 'effect';
import { Pool } from 'pg';

import { schema } from './schema';

export class QueryError extends Data.TaggedError('QueryError')<{
  message: string;
  cause?: unknown;
}> {}

export type DbClientDatabase = NodePgDatabase<typeof schema>;

const databaseUrlConfig = Config.string('DATABASE_URL').pipe(
  Config.withDescription('Postgres connection string used by the audit persistence runtime.'),
);
const connectionTimeoutMillisConfig = Config.integer('DATABASE_CONNECTION_TIMEOUT_MS').pipe(Config.withDefault(5_000));

export class DbClient extends Context.Tag('DbClient')<
  DbClient,
  {
    readonly run: <A>(f: (db: DbClientDatabase) => A | Promise<A>) => Effect.Effect<A, QueryError>;
  }
>() {
  static live = Layer.scoped(
    DbClient,
    Effect.acquireRelease(
      Effect.gen(function* () {
        const databaseUrl = yield* databaseUrlConfig;
        const connectionTimeoutMillis = yield* connectionTimeoutMillisConfig;
        const pool = new Pool({ connectionString: databaseUrl, connectionTimeoutMillis });
        const db = drizzle(pool, { schema });

        yield* Effect.logInfo('Initialized audit Postgres connection pool from DATABASE_URL');

        const run = <A>(f: (currentDb: DbClientDatabase) => A | Promise<A>): Effect.Effect<A, QueryError> =>
          Effect.tryPromise({
            try: () => Promise.resolve(f(db)),
            catch: (error) => new QueryError({ message: 'Database operation failed', cause: error }),
          });

        return { pool, run };
      }),
      ({ pool }) => Effect.promise(() => pool.end()).pipe(Effect.orDie),
    ).pipe(Effect.map(({ run }) => ({ run }))),
  );
}
