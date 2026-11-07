import { Config, Context, Effect, Layer, Schema } from 'effect';
import { Pool } from 'pg';
import { WorkspaceConflict, WorkspaceForbidden, WorkspaceUnavailable } from '@app-speed/workspace/domain';

export type WorkspaceError = WorkspaceConflict | WorkspaceForbidden | WorkspaceUnavailable;
export type WorkspaceSql = <S extends Schema.Top & { readonly DecodingServices: never }>(
  schema: S,
  text: string,
  values?: ReadonlyArray<unknown>,
) => Effect.Effect<ReadonlyArray<S['Type']>, WorkspaceError>;

export const makeWorkspaceSql =
  (client: { query: (text: string, values: unknown[]) => Promise<{ rows: unknown[] }> }): WorkspaceSql =>
  (schema, text, values = []) =>
    Effect.tryPromise({
      try: () => client.query(text, [...values]),
      catch: () =>
        new WorkspaceUnavailable({ message: 'Workspace data could not be saved or loaded. Please try again.' }),
    }).pipe(
      Effect.flatMap((result) => Schema.decodeUnknownEffect(Schema.Array(schema))(result.rows)),
      Effect.mapError(
        () => new WorkspaceUnavailable({ message: 'Workspace data could not be saved or loaded. Please try again.' }),
      ),
    );

export class WorkspaceStore extends Context.Service<
  WorkspaceStore,
  {
    readonly transaction: <A>(
      use: (sql: WorkspaceSql) => Effect.Effect<A, WorkspaceError>,
    ) => Effect.Effect<A, WorkspaceError>;
  }
>()('WorkspaceStore') {}

export const runWorkspaceTransaction = <A>(
  sql: WorkspaceSql,
  use: (sql: WorkspaceSql) => Effect.Effect<A, WorkspaceError>,
) => {
  const control = (statement: string) => sql(Schema.Unknown, statement);
  return Effect.gen(function* () {
    yield* control('BEGIN');
    return yield* use(sql).pipe(
      Effect.tap(() => control('COMMIT')),
      Effect.onError(() => control('ROLLBACK').pipe(Effect.ignore)),
    );
  });
};

export const WorkspaceStoreLive = Layer.effect(WorkspaceStore)(
  Effect.gen(function* () {
    const connectionString = yield* Config.String('DATABASE_URL');
    const pool = yield* Effect.acquireRelease(
      Effect.sync(() => new Pool({ connectionString, connectionTimeoutMillis: 5000 })),
      (value) => Effect.promise(() => value.end()),
    );
    return {
      transaction: <A>(use: (sql: WorkspaceSql) => Effect.Effect<A, WorkspaceError>) =>
        Effect.acquireUseRelease(
          Effect.tryPromise({
            try: () => pool.connect(),
            catch: () => new WorkspaceUnavailable({ message: 'Workspace storage is unavailable.' }),
          }),
          (client) => runWorkspaceTransaction(makeWorkspaceSql(client), use),
          (client) => Effect.sync(() => client.release()),
        ),
    };
  }),
);
