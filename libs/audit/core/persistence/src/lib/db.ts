import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Config, Context, Data, Effect, Layer, Schema } from 'effect';
import { Pool } from 'pg';

import { schema } from './schema';

export class QueryError extends Data.TaggedError('QueryError')<{
  message: string;
  cause?: unknown;
}> {}

export type DbClientDatabase = NodePgDatabase<typeof schema>;

const databaseUrlConfig = Config.schema(
  Schema.String.annotate({ description: 'Postgres connection string used by the audit persistence runtime.' }),
  'DATABASE_URL',
);
const connectionTimeoutMillisConfig = Config.int('DATABASE_CONNECTION_TIMEOUT_MS').pipe(Config.withDefault(5_000));

export class DbClient extends Context.Service<
  DbClient,
  {
    readonly run: <A>(f: (db: DbClientDatabase) => A | Promise<A>) => Effect.Effect<A, QueryError>;
  }
>()('DbClient') {
  static live = Layer.effect(DbClient)(
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
