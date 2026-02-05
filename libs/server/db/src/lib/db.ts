import { PrismaClient } from '@prisma/client';
import { Context, Data, Effect, Layer } from 'effect';

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
  static live = Layer.effect(
    DbClient,
    Effect.sync(() => {
      const adapter = new PrismaLibSql({ url: `file:tmp/dev.db` });
      const client = new PrismaClient({ adapter, log: ['info', 'warn', 'error'] });

      const withDatabaseError = <A>(operation: () => Promise<A>): Effect.Effect<A, QueryError> =>
        Effect.tryPromise({
          try: operation,
          catch: (error) => new QueryError({ message: 'Database operation failed', cause: error }),
        });

      const run = <A>(f: (p: PrismaClient) => Promise<A>) => withDatabaseError(() => f(client));

      return { run };
    }),
  );
}
