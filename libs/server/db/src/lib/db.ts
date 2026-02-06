import { PrismaClient } from '@prisma/client';
import { Config, Context, Data, Effect, Layer } from 'effect';

import { PrismaLibSql } from '@prisma/adapter-libsql';

export class QueryError extends Data.TaggedError('QueryError')<{
  message: string;
  cause?: unknown;
}> {}

export class DbClient extends Context.Tag('DbClient')<
  DbClient,
  {
    readonly run: <A>(f: (prisma: PrismaClient) => Promise<A>) => Effect.Effect<A, QueryError>;
  }
>() {
  static live = Layer.scoped(
    DbClient,
    Effect.acquireRelease(
      Effect.gen(function* () {
        const databaseUrl = yield* Config.string('DATABASE_URL').pipe(Config.withDefault('file:./tmp/dev.db'));
        const adapter = new PrismaLibSql({ url: databaseUrl });
        const client = new PrismaClient({ adapter, log: ['info', 'warn', 'error'] });

        yield* Effect.logInfo(`Initialize DB from ${databaseUrl} resolved too`);

        const withDatabaseError = <A>(operation: () => Promise<A>): Effect.Effect<A, QueryError> =>
          Effect.tryPromise({
            try: operation,
            catch: (error) => new QueryError({ message: 'Database operation failed', cause: error }),
          });

        const run = <A>(f: (p: PrismaClient) => Promise<A>) => withDatabaseError(() => f(client));

        return { client, run };
      }),
      ({ client }) => Effect.tryPromise(() => client.$disconnect()).pipe(Effect.orDie),
    ).pipe(Effect.map(({ run }) => ({ run }))),
  );
}
