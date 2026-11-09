import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { Config, Effect, Layer, Semaphore } from 'effect';
import { WorkspaceStore, makeWorkspaceSql, runWorkspaceTransaction } from '@app-speed/workspace/api-runtime';

// Only imported by test entry points, never by the production API.
export const WorkspaceTestStoreLive = Layer.effect(WorkspaceStore)(
  Effect.gen(function* () {
    const path = yield* Config.String('WORKSPACE_TEST_PATH');
    const db = yield* Effect.acquireRelease(
      Effect.promise(() => PGlite.create(path)),
      (value) => Effect.promise(() => value.close()),
    );
    yield* Effect.promise(async () => {
      for (const migration of ['0004_workspaces_and_projects.sql', '0005_workspace_logo.sql']) {
        await db.exec(await readFile(`apps/api/migrations/${migration}`, 'utf8'));
      }
    });
    const semaphore = Semaphore.makeUnsafe(1);
    return { transaction: (use) => semaphore.withPermits(1)(runWorkspaceTransaction(makeWorkspaceSql(db), use)) };
  }),
);
