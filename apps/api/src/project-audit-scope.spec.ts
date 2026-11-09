import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { ConfigProvider, Effect, Layer, ManagedRuntime, Schema } from 'effect';
import { HttpRouter } from 'effect/http';
import { HttpApi, HttpApiBuilder } from 'effect/http-api';
import { NodeHttpServer } from '@effect/platform-node';
import { Identity, SignInRequired } from '@app-speed/platform/identity';
import { WorkspaceStore, makeWorkspaceSql, runWorkspaceTransaction } from '@app-speed/workspace/api-runtime';
import { AuditApiGroup, RunnerApiGroup } from '@app-speed/audit/core/api-contract';
import {
  AuditGroupLive,
  RunnerGroupLive,
  RunnerRegistryLive,
  RunnerLifecycle,
} from '@app-speed/audit/core/api-runtime';
import {
  AuditRunIdSchema,
  SqliteDbClient,
  SqliteAuditRepoLive,
  SqliteAuditHistoryRepoLive,
  SqliteRecordPersistenceLive,
} from '@app-speed/audit/core/persistence';
import { UserFlowAuditApiGroup } from '@app-speed/audit/user-flow/api-contract';
import { UserFlowAuditGroupLive } from '@app-speed/audit/user-flow/api-runtime';
import {
  SqliteUserFlowAuditRepoLive,
  SqliteUserFlowAuditSchedulerLive,
  UserFlowAuditRepo,
} from '@app-speed/audit/user-flow/persistence';

const workspaceA = '00000000-0000-4000-8000-000000000001';
const workspaceB = '00000000-0000-4000-8000-000000000002';
const projectA = '00000000-0000-4000-8000-000000000003';
const projectB = '00000000-0000-4000-8000-000000000004';
const projectC = '00000000-0000-4000-8000-000000000005';
const definition = {
  title: 'Scoped checkout',
  device: 'mobile',
  steps: [
    { type: 'customStep', step: 'startNavigation' },
    { type: 'navigate', url: 'https://example.com' },
    { type: 'customStep', step: 'endNavigation' },
  ],
};
const Scheduled = Schema.Struct({ auditId: AuditRunIdSchema });
const History = Schema.Struct({ items: Schema.Array(Schema.Struct({ auditId: Schema.String })) });

import { InstalledAuditFeaturesLive } from './http/InstalledAuditFeatures';

class TestApi extends HttpApi.make('api')
  .add(AuditApiGroup)
  .add(RunnerApiGroup)
  .add(UserFlowAuditApiGroup)
  .prefix('/api') {}

const base = Layer.provideMerge(SqliteRecordPersistenceLive, SqliteDbClient.live);
const repos = Layer.provideMerge(SqliteAuditHistoryRepoLive, Layer.provideMerge(SqliteAuditRepoLive, base));
const persistence = Layer.provideMerge(
  SqliteUserFlowAuditRepoLive,
  Layer.provideMerge(SqliteUserFlowAuditSchedulerLive, repos),
);

describe('project audit isolation over HTTP', () => {
  let db: PGlite;
  let directory: string;
  let runtime: ManagedRuntime.ManagedRuntime<Layer.Success<typeof persistence>, Layer.Error<typeof persistence>>;
  let app: { handler: (request: Request) => Promise<Response>; dispose: () => Promise<void> };
  let publicId: string;
  let privateId: string;
  const request = (path: string, projectId?: string, account?: string, payload?: unknown) =>
    app.handler(
      new Request(`http://localhost/api/audits/${path}`, {
        method: payload ? 'POST' : 'GET',
        headers: {
          ...(projectId ? { 'x-project-id': projectId } : {}),
          ...(account ? { Authorization: `Bearer ${account}` } : {}),
          ...(payload ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
      }),
    );
  const schedule = async (projectId?: string, account?: string) => {
    const response = await request('user-flow/schedule', projectId, account, definition);
    expect(response.status).toBe(200);
    return Schema.decodeUnknownSync(Scheduled)(await response.json()).auditId;
  };
  const history = async (projectId?: string, account?: string, path = 'history') => {
    const response = await request(path, projectId, account);
    expect(response.status).toBe(200);
    return Schema.decodeUnknownSync(History)(await response.json()).items.map((item) => item.auditId);
  };

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'scope-http-'));
    db = new PGlite();
    await db.exec(await readFile(new URL('../migrations/0004_workspaces_and_projects.sql', import.meta.url), 'utf8'));
    await db.query(`INSERT INTO accounts(id,email,name,image_url) VALUES
      ('admin','admin@example.com','Admin',''), ('member','member@example.com','Member',''),
      ('ungranted','ungranted@example.com','Ungrant',''), ('other','other@example.com','Other','')`);
    await db.query("INSERT INTO workspaces(id,name) VALUES ($1,'PushBased'),($2,'Other')", [workspaceA, workspaceB]);
    await db.query(
      `INSERT INTO workspace_members(workspace_id,account_id,role) VALUES
      ($1,'admin','admin'),($1,'member','member'),($1,'ungranted','member'),($2,'other','admin')`,
      [workspaceA, workspaceB],
    );
    await db.query(
      "INSERT INTO projects(id,workspace_id,name) VALUES ($1,$2,'Eurobets'),($3,$2,'Other project'),($4,$5,'Other workspace')",
      [projectA, workspaceA, projectB, projectC, workspaceB],
    );
    await db.query("INSERT INTO project_members(workspace_id,project_id,account_id) VALUES ($1,$2,'member')", [
      workspaceA,
      projectA,
    ]);
    runtime = ManagedRuntime.make(
      persistence.pipe(
        Layer.provide(
          Layer.succeed(
            ConfigProvider.ConfigProvider,
            ConfigProvider.fromUnknown({ SQLITE_PATH: join(directory, 'audits.sqlite') }),
          ),
        ),
      ),
    );
    app = HttpRouter.toWebHandler(
      HttpApiBuilder.layer(TestApi).pipe(
        Layer.provide([AuditGroupLive, UserFlowAuditGroupLive, RunnerGroupLive]),
        Layer.provide(InstalledAuditFeaturesLive),
        Layer.provide(RunnerRegistryLive),
        Layer.provide(
          Layer.succeed(
            ConfigProvider.ConfigProvider,
            ConfigProvider.fromUnknown({ RUNNER_API_TOKEN: 'test-runner-token' }),
          ),
        ),
        Layer.provide(Layer.succeedContext(await runtime.context())),
        Layer.provide(
          Layer.succeed(WorkspaceStore, { transaction: (use) => runWorkspaceTransaction(makeWorkspaceSql(db), use) }),
        ),
        Layer.provide(
          Layer.succeed(Identity, {
            authenticate: (authorization) => {
              const id = authorization?.replace('Bearer ', '');
              return id && ['admin', 'member', 'ungranted', 'other'].includes(id)
                ? Effect.succeed({ id, email: `${id}@example.com`, name: id, imageUrl: '' })
                : Effect.fail(new SignInRequired({ message: 'Sign in required' }));
            },
          }),
        ),
        Layer.provide(
          Layer.succeed(RunnerLifecycle, {
            requestActivation: Effect.void,
            requestInactivationIfQueueEmpty: () => Effect.succeed({ shouldTerminate: false }),
          }),
        ),
        Layer.provide(NodeHttpServer.layerHttpServices),
      ),
      { disableLogger: true },
    );
    publicId = await schedule();
    privateId = await schedule(projectA, 'member');
    const id = Schema.decodeUnknownSync(AuditRunIdSchema)(privateId);
    await runtime.runPromise(
      Effect.gen(function* () {
        const repo = yield* UserFlowAuditRepo;
        yield* repo.completeSuccess(id, { flowResult: { steps: [] }, reportHtml: '<h1>Private report</h1>' }, 1);
      }),
    );
    await schedule(projectB, 'admin');
    await schedule(projectC, 'other');
  }, 30000);
  afterAll(async () => {
    await app?.dispose();
    await runtime?.dispose();
    await db?.close();
    await rm(directory, { recursive: true, force: true });
  });

  it('isolates global and kind-specific histories across projects and workspaces', async () => {
    for (const path of ['history', 'user-flow/history']) {
      expect(await history(undefined, undefined, path)).toEqual([publicId]);
      expect(await history(projectA, 'member', path)).toEqual([privateId]);
      expect(await history(projectA, 'admin', path)).toEqual([privateId]);
      expect(await history(projectB, 'admin', path)).not.toContain(privateId);
      expect(await history(projectC, 'other', path)).not.toContain(privateId);
    }
  });

  it('requires an authenticated project grant for scheduling and history', async () => {
    for (const account of [undefined, 'ungranted', 'other']) {
      expect((await request('history', projectA, account)).status).toBe(403);
      expect((await request('user-flow/schedule', projectA, account, definition)).status).toBe(403);
    }
    expect((await request('history', 'invalid', 'admin')).status).toBe(403);
  });

  it('protects definitions, JSON results, HTML reports and progress streams from ID-only access', async () => {
    for (const suffix of ['', '/result', '/report', '/events']) {
      for (const account of [undefined, 'admin', 'member', 'other']) {
        expect((await request(`user-flow/${privateId}${suffix}`, undefined, account)).status).toBe(404);
      }
      expect((await request(`user-flow/${privateId}${suffix}`, projectB, 'admin')).status).toBe(404);
      expect((await request(`user-flow/${privateId}${suffix}`, projectA, 'ungranted')).status).toBe(403);
      const response = await request(`user-flow/${privateId}${suffix}`, projectA, 'member');
      expect(response.status).toBe(200);
      await response.body?.cancel();
      expect((await request(`user-flow/${publicId}${suffix}`, projectA, 'member')).status).toBe(404);
    }
    expect((await request(`user-flow/${publicId}`)).status).toBe(200);
  });

  it('requires a runner credential before claiming or modifying any audit', async () => {
    const payloads = [
      ['claim', { runnerId: 'untrusted' }],
      ['heartbeat', { runnerId: 'untrusted' }],
      ['shutdown', { runnerId: 'untrusted', reason: 'IDLE_TIMEOUT' }],
      [
        'complete',
        { runnerId: 'untrusted', auditId: privateId, kind: 'user-flow', status: 'SUCCESS', result: {}, durationMs: 1 },
      ],
    ];
    for (const [path, payload] of payloads) {
      for (const token of ['', 'Bearer member']) {
        const response = await app.handler(
          new Request(`http://localhost/api/runner/${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: token },
            body: JSON.stringify(payload),
          }),
        );
        expect(response.status).toBe(403);
      }
    }
    const response = await app.handler(
      new Request('http://localhost/api/runner/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-runner-token' },
        body: JSON.stringify({ runnerId: 'trusted' }),
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ available: true, auditId: publicId });
  });

  it('rechecks revoked grants and keeps deleted-project audits private', async () => {
    await db.query('DELETE FROM project_members WHERE project_id=$1', [projectA]);
    expect((await request(`user-flow/${privateId}/report`, projectA, 'member')).status).toBe(403);
    await db.query('DELETE FROM workspaces WHERE id=$1', [workspaceA]);
    expect((await request(`user-flow/${privateId}/result`, projectA, 'admin')).status).toBe(403);
    expect((await request(`user-flow/${privateId}/result`)).status).toBe(404);
    expect(await history()).toEqual([publicId]);
  });
});
