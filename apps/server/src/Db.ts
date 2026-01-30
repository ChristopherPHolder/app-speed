import { PrismaClient } from '@prisma/client';
import { Context, Data, Effect, Layer } from 'effect';

import { PrismaLibSql } from '@prisma/adapter-libsql';

export const QUERY_ERROR_TAG = 'QueryError';

export class QueryError extends Data.TaggedError(QUERY_ERROR_TAG)<{
  message: string;
  cause?: unknown;
}> {}

interface DbClient {
  readonly run: <A>(f: (prisma: PrismaClient) => Promise<A>) => Effect.Effect<A, QueryError>;
}

export const DbClientService = Context.GenericTag<DbClient>('Db');

const makeDbClient = (): DbClient => {
  const adapter = new PrismaLibSql({ url: `file:tmp/dev.db` });
  const client = new PrismaClient({ adapter, log: ['info', 'warn', 'error'] });

  return {
    run: <A>(f: (p: PrismaClient) => Promise<A>) => withDatabaseError(() => f(client)),
  } satisfies DbClient;
};

export const DbClientServiceLive = Layer.succeed(DbClientService, makeDbClient());

export const withDatabaseError = <A>(operation: () => Promise<A>): Effect.Effect<A, QueryError> =>
  Effect.tryPromise({
    try: operation,
    catch: (error) => new QueryError({ message: 'Database operation failed', cause: error }),
  });
