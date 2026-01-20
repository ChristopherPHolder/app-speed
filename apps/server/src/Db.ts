import { PrismaClient } from '@prisma/client';
import { Context, Data, Effect, Layer, Schema } from 'effect';
import { HttpApiSchema } from '@effect/platform';

import { PrismaLibSql } from '@prisma/adapter-libsql';

export const QUERY_ERROR_TAG = 'QueryError';

class QueryError extends Data.TaggedError(QUERY_ERROR_TAG)<{
  message: string;
  cause?: unknown;
}> {}

// HTTP API version of QueryError for use in API definitions
export class QueryErrorApi extends Schema.TaggedError<QueryErrorApi>()(
  QUERY_ERROR_TAG,
  { message: Schema.String },
  HttpApiSchema.annotations({ status: 500 }),
) {}

interface DbClient {
  readonly run: <A>(f: (prisma: PrismaClient) => Promise<A>) => Effect.Effect<A, QueryError>;
}

export const DbClientService = Context.GenericTag<DbClient>('Db');

const makeDbClient = (): DbClient => {
  const adapter = new PrismaLibSql({ url: `file:tmp/dev.db` });
  const client = new PrismaClient({ adapter, log: ['query', 'info', 'warn', 'error'] });

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
