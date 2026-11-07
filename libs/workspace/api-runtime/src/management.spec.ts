import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { Effect, Layer } from 'effect';
import { HttpRouter } from 'effect/http';
import { HttpApi, HttpApiBuilder } from 'effect/http-api';
import { NodeHttpServer } from '@effect/platform-node';
import { Identity, SignInRequired } from '@app-speed/platform/identity';
import { WorkspaceApiGroup, WorkspaceGroupLive } from './index';
import type { AccountIdentity } from '@app-speed/platform/identity';
import type { WorkspaceAction } from '@app-speed/workspace/domain';
import { executeWorkspaceAction, loadWorkspaceOverview } from './management';
import { WorkspaceStore, makeWorkspaceSql, runWorkspaceTransaction } from './store';

const chris: AccountIdentity = { id: 'user_chris', name: 'Chris', email: 'chris@example.com', imageUrl: '' };
const pat: AccountIdentity = { id: 'user_pat', name: 'Pat', email: 'pat@example.com', imageUrl: '' };
const outsider: AccountIdentity = {
  id: 'user_outsider',
  name: 'Outsider',
  email: 'outsider@example.com',
  imageUrl: '',
};

describe('workspace management with Postgres', () => {
  let db: PGlite;
  let app: { handler: (request: Request) => Promise<Response>; dispose: () => Promise<void> };
  let store: typeof WorkspaceStore.Service;
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(
      await readFile(
        new URL('../../../../apps/api/migrations/0004_workspaces_and_projects.sql', import.meta.url),
        'utf8',
      ),
    );
    await db.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
    await db.exec('GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;');
    await db.exec(
      await readFile(new URL('../../../../apps/api/migrations/0005_workspace_logo.sql', import.meta.url), 'utf8'),
    );
    store = { transaction: (use) => runWorkspaceTransaction(makeWorkspaceSql(db), use) };
    class Api extends HttpApi.make('api').add(WorkspaceApiGroup).prefix('/api') {}
    app = HttpRouter.toWebHandler(
      HttpApiBuilder.layer(Api).pipe(
        Layer.provide(WorkspaceGroupLive),
        Layer.provide(Layer.succeed(WorkspaceStore, store)),
        Layer.provide(
          Layer.succeed(Identity, {
            authenticate: (authorization) =>
              authorization === 'Bearer chris'
                ? Effect.succeed(chris)
                : authorization === 'Bearer outsider'
                  ? Effect.succeed(outsider)
                  : Effect.fail(new SignInRequired({ message: 'Sign in required.' })),
          }),
        ),
        Layer.provide(NodeHttpServer.layerHttpServices),
      ),
      { disableLogger: true },
    );
  }, 30000);
  afterAll(async () => {
    await app?.dispose();
    await db?.close();
  });
  beforeEach(async () => {
    await db.exec('TRUNCATE accounts,workspaces CASCADE');
  });
  const action = (account: AccountIdentity, payload: WorkspaceAction) =>
    Effect.runPromise(executeWorkspaceAction(account, payload).pipe(Effect.provideService(WorkspaceStore, store)));
  const overview = (account: AccountIdentity) =>
    Effect.runPromise(loadWorkspaceOverview(account).pipe(Effect.provideService(WorkspaceStore, store)));
  const failure = (account: AccountIdentity, payload: WorkspaceAction) =>
    Effect.runPromise(
      executeWorkspaceAction(account, payload).pipe(Effect.provideService(WorkspaceStore, store), Effect.flip),
    );
  const create = async (name = 'Holder') => (await action(chris, { action: 'createWorkspace', name })).id;
  const join = async (workspaceId: string, role: 'admin' | 'member' = 'member') => {
    await action(chris, { action: 'inviteMember', workspaceId, email: pat.email, role });
    const [invitation] = (await overview(pat)).invitations;
    if (!invitation) throw new Error('Missing invitation');
    await action(pat, { action: 'acceptInvitation', invitationId: invitation.id });
  };

  it('creates a same-named project with the workspace and gives its creator admin access', async () => {
    const id = await create('  Holder  ');
    const workspace = (await overview(chris)).workspaces.find((item) => item.id === id);
    expect(workspace?.name).toBe('Holder');
    expect(workspace?.role).toBe('admin');
    expect(workspace?.projects).toEqual([{ id: expect.any(String), name: 'Holder', memberIds: [] }]);
    await join(id);
    expect((await overview(pat)).workspaces[0].projects).toHaveLength(0);
  });

  it('keeps one account across multiple workspaces and preserves independent roles', async () => {
    const holder = await create();
    const entain = (await action(pat, { action: 'createWorkspace', name: 'Entain' })).id;
    await action(pat, { action: 'inviteMember', workspaceId: entain, email: chris.email, role: 'member' });
    const [invitation] = (await overview(chris)).invitations;
    await action(chris, { action: 'acceptInvitation', invitationId: invitation.id });
    const result = await overview(chris);
    expect(result.workspaces.find((item) => item.id === holder)?.role).toBe('admin');
    expect(result.workspaces.find((item) => item.id === entain)?.role).toBe('member');
    expect((await db.query('SELECT * FROM accounts')).rows).toHaveLength(2);
  });

  it('accepts invitations only for their verified recipient and rejects expired and revoked invitations', async () => {
    const workspaceId = await create();
    await action(chris, { action: 'inviteMember', workspaceId, email: 'PAT@EXAMPLE.COM', role: 'member' });
    let [invitation] = (await overview(pat)).invitations;
    expect((await failure(outsider, { action: 'acceptInvitation', invitationId: invitation.id }))._tag).toBe(
      'WorkspaceConflict',
    );
    expect((await overview(outsider)).workspaces).toHaveLength(0);
    await db.query("UPDATE workspace_invitations SET expires_at=now()-interval '1 minute' WHERE id=$1", [
      invitation.id,
    ]);
    expect((await failure(pat, { action: 'acceptInvitation', invitationId: invitation.id }))._tag).toBe(
      'WorkspaceConflict',
    );
    await action(chris, { action: 'inviteMember', workspaceId, email: pat.email, role: 'member' });
    [invitation] = (await overview(pat)).invitations;
    await action(chris, { action: 'revokeInvitation', workspaceId, invitationId: invitation.id });
    expect((await failure(pat, { action: 'acceptInvitation', invitationId: invitation.id }))._tag).toBe(
      'WorkspaceConflict',
    );
  });

  it('filters projects by grants and rejects mutations by members and outsiders even with known IDs', async () => {
    const workspaceId = await create();
    await join(workspaceId);
    const projectId = (await action(chris, { action: 'createProject', workspaceId, name: 'Storefront' })).id;
    expect((await overview(pat)).workspaces[0].projects).toHaveLength(0);
    for (const account of [pat, outsider]) {
      expect((await failure(account, { action: 'renameProject', workspaceId, projectId, name: 'Changed' }))._tag).toBe(
        'WorkspaceForbidden',
      );
      expect(
        (await failure(account, { action: 'inviteMember', workspaceId, email: 'another@example.com', role: 'admin' }))
          ._tag,
      ).toBe('WorkspaceForbidden');
    }
    await action(chris, { action: 'grantProjectAccess', workspaceId, projectId, accountId: pat.id });
    expect((await overview(pat)).workspaces[0].projects.map((item) => item.name)).toEqual(['Storefront']);
    await action(chris, { action: 'revokeProjectAccess', workspaceId, projectId, accountId: pat.id });
    expect((await overview(pat)).workspaces[0].projects).toHaveLength(0);
  });

  it('denies project grants across workspace boundaries or to non-members', async () => {
    const workspaceId = await create();
    const otherWorkspaceId = await create('PushBased');
    const projectId = (await action(chris, { action: 'createProject', workspaceId, name: 'Storefront' })).id;
    expect(
      (
        await failure(chris, {
          action: 'grantProjectAccess',
          workspaceId: otherWorkspaceId,
          projectId,
          accountId: chris.id,
        })
      )._tag,
    ).toBe('WorkspaceForbidden');
    expect(
      (await failure(chris, { action: 'grantProjectAccess', workspaceId, projectId, accountId: outsider.id }))._tag,
    ).toBe('WorkspaceForbidden');
    expect((await db.query('SELECT * FROM project_members')).rows).toHaveLength(0);
  });

  it('protects the last admin on demotion, removal, and leaving, then permits a transfer', async () => {
    const workspaceId = await create();
    for (const payload of [
      { action: 'setRole', workspaceId, accountId: chris.id, role: 'member' },
      { action: 'removeMember', workspaceId, accountId: chris.id },
      { action: 'leaveWorkspace', workspaceId },
    ] satisfies ReadonlyArray<WorkspaceAction>)
      expect((await failure(chris, payload))._tag).toBe('WorkspaceConflict');
    await join(workspaceId, 'admin');
    await action(chris, { action: 'leaveWorkspace', workspaceId });
    expect((await overview(chris)).workspaces).toHaveLength(0);
    expect((await overview(pat)).workspaces[0].role).toBe('admin');
  });

  it('removes project grants with membership and does not restore them when rejoining', async () => {
    const workspaceId = await create();
    await join(workspaceId);
    const projectId = (await action(chris, { action: 'createProject', workspaceId, name: 'Storefront' })).id;
    await action(chris, { action: 'grantProjectAccess', workspaceId, projectId, accountId: pat.id });
    await action(chris, { action: 'removeMember', workspaceId, accountId: pat.id });
    expect((await overview(pat)).workspaces).toHaveLength(0);
    expect((await failure(pat, { action: 'createProject', workspaceId, name: 'Forbidden' }))._tag).toBe(
      'WorkspaceForbidden',
    );
    await join(workspaceId);
    expect((await overview(pat)).workspaces[0].projects).toHaveLength(0);
  });

  it('renames and deletes projects and workspaces with dependent grants and invitations', async () => {
    const workspaceId = await create();
    await join(workspaceId);
    const projectId = (await action(chris, { action: 'createProject', workspaceId, name: 'Storefront' })).id;
    await action(chris, { action: 'grantProjectAccess', workspaceId, projectId, accountId: pat.id });
    await action(chris, { action: 'renameProject', workspaceId, projectId, name: 'Documentation' });
    await action(chris, { action: 'renameWorkspace', workspaceId, name: 'PushBased' });
    expect((await overview(pat)).workspaces[0]).toMatchObject({
      name: 'PushBased',
      projects: [{ name: 'Documentation' }],
    });
    await action(chris, { action: 'deleteProject', workspaceId, projectId });
    expect((await db.query('SELECT * FROM project_members')).rows).toHaveLength(0);
    await action(chris, { action: 'inviteMember', workspaceId, email: outsider.email, role: 'member' });
    await action(chris, { action: 'deleteWorkspace', workspaceId });
    expect((await overview(pat)).workspaces).toHaveLength(0);
    expect((await overview(outsider)).invitations).toHaveLength(0);
  });
  it('lets an admin upload, replace and remove a logo visible only to workspace members', async () => {
    const workspaceId = await create();
    await join(workspaceId, 'member');
    const logo =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAIAAABMXPacAAAA+UlEQVR4nO3RQQ0AIAzAwAlBGPZw' +
      'iow9ekkFNLk592mxWT+IBwBAOwAA2gEA0A4AgHYAALQDAKAdAADtAABoBwBAOwAA2gEA0A4AgHYAALQDAKAdAADtAABoBwBAOw' +
      'AA2gEA0A4AgHYAALQDAKAdAADtAABoBwBAOwAA2gEA0A4AgHYAALQDAKAdAADtAABoBwBAOwAA2gEA0A4AgHYAALQDAKAdAADt' +
      'AABoBwBAOwAA2gEA0A4AgHYAALQDAKAdAADtAABoBwBAOwAA2gEA0A4AgHYAALQDAKAdAADtAABoBwBAOwAA2gEA0A4AgHYAAL' +
      'QDAKAdAADtPiEqRAyR0CT1AAAAAElFTkSuQmCC';
    const replacement =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAIAAABMXPacAAAA+UlEQVR4nO3RQQ0AIAzAwInBDnbQ' +
      'j4w9ekkFNLm552mxWT+IBwBAOwAA2gEA0A4AgHYAALQDAKAdAADtAABoBwBAOwAA2gEA0A4AgHYAALQDAKAdAADtAABoBwBAOw' +
      'AA2gEA0A4AgHYAALQDAKAdAADtAABoBwBAOwAA2gEA0A4AgHYAALQDAKAdAADtAABoBwBAOwAA2gEA0A4AgHYAALQDAKAdAADt' +
      'AABoBwBAOwAA2gEA0A4AgHYAALQDAKAdAADtAABoBwBAOwAA2gEA0A4AgHYAALQDAKAdAADtAABoBwBAOwAA2gEA0A4AgHYAAL' +
      'QDAKAdAADtPkOUw1jTWxBGAAAAAElFTkSuQmCC';
    const upload = (image: string | null) =>
      app.handler(
        new Request('http://localhost/api/workspaces/actions', {
          method: 'POST',
          headers: { Authorization: 'Bearer chris', 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'setWorkspaceLogo', workspaceId, logo: image }),
        }),
      );

    expect((await upload('data:image/svg+xml,<svg/>')).status).toBe(400);
    expect((await upload(logo + 'A'.repeat(100_000))).status).toBe(400);
    expect((await upload(logo)).status).toBe(200);
    expect((await overview(pat)).workspaces[0]?.logo).toBe(logo);
    expect((await overview(outsider)).workspaces).toHaveLength(0);
    expect((await failure(pat, { action: 'setWorkspaceLogo', workspaceId, logo: null }))._tag).toBe(
      'WorkspaceForbidden',
    );
    expect((await upload(replacement)).status).toBe(200);
    expect((await overview(pat)).workspaces[0]?.logo).toBe(replacement);
    expect((await upload(null)).status).toBe(200);
    expect((await overview(pat)).workspaces[0]?.logo).toBeNull();
  });

  it('revokes the Data API roles’ direct access to workspace data', async () => {
    const result = await db.query(`
      SELECT bool_and(relrowsecurity) AS protected,
        bool_or(has_table_privilege('anon', oid, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE')
          OR has_table_privilege('authenticated', oid, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE')) AS exposed
      FROM pg_class
      WHERE relnamespace = 'public'::regnamespace AND relname IN
        ('accounts', 'projects', 'project_members', 'workspace_invitations', 'workspace_members', 'workspaces')
    `);
    expect(result.rows).toEqual([{ protected: true, exposed: false }]);
  });

  it('enforces identity, validates action bodies, and persists through the real HTTP API', async () => {
    const url = 'http://localhost/api/workspaces';
    expect((await app.handler(new Request(url))).status).toBe(401);
    const createResponse = await app.handler(
      new Request(url + '/actions', {
        method: 'POST',
        headers: { Authorization: 'Bearer chris', 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createWorkspace', name: 'HTTP workspace' }),
      }),
    );
    expect(createResponse.status).toBe(200);
    const own = await app.handler(new Request(url, { headers: { Authorization: 'Bearer chris' } }));
    expect(own.status).toBe(200);
    expect(await own.json()).toMatchObject({ account: { id: chris.id }, workspaces: [{ name: 'HTTP workspace' }] });
    const [{ id: workspaceId }] = (await overview(chris)).workspaces;
    const forbiddenResponse = await app.handler(
      new Request(url + '/actions', {
        method: 'POST',
        headers: { Authorization: 'Bearer outsider', 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteWorkspace', workspaceId }),
      }),
    );
    expect(forbiddenResponse.status).toBe(403);
    const invalidResponse = await app.handler(
      new Request(url + '/actions', {
        method: 'POST',
        headers: { Authorization: 'Bearer chris', 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteWorkspace', workspaceId: 'malformed' }),
      }),
    );
    expect(invalidResponse.status).toBe(400);
    const conflictResponse = await app.handler(
      new Request(url + '/actions', {
        method: 'POST',
        headers: { Authorization: 'Bearer chris', 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'leaveWorkspace', workspaceId }),
      }),
    );
    expect(conflictResponse.status).toBe(409);
    expect((await overview(chris)).workspaces).toHaveLength(1);
  });
});
