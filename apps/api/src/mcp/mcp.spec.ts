import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { ConfigProvider, Effect, Layer, ManagedRuntime, Schema } from 'effect';
import { HttpRouter } from 'effect/http';
import { NodeHttpServer } from '@effect/platform-node';
import { Identity, SignInRequired } from '@app-speed/platform/identity';
import { WorkspaceStore, makeWorkspaceSql, runWorkspaceTransaction } from '@app-speed/workspace/api-runtime';
import { RunnerLifecycle } from '@app-speed/audit/core/api-runtime';
import {
  AuditRunIdSchema,
  SqliteDbClient,
  SqliteAuditRepoLive,
  SqliteAuditHistoryRepoLive,
  SqliteRecordPersistenceLive,
} from '@app-speed/audit/core/persistence';
import {
  SqliteUserFlowAuditRepoLive,
  SqliteUserFlowAuditSchedulerLive,
  UserFlowAuditRepo,
} from '@app-speed/audit/user-flow/persistence';

import { McpLive } from './Mcp';

const workspaceA = '00000000-0000-4000-8000-000000000001';
const projectA = '00000000-0000-4000-8000-000000000003';
const projectB = '00000000-0000-4000-8000-000000000004';
const resource = 'https://appspeed.dev/mcp';
const definition = {
  title: 'Checkout',
  device: 'mobile',
  steps: [
    { type: 'customStep', step: 'startNavigation' },
    { type: 'navigate', url: 'https://example.com' },
    { type: 'customStep', step: 'endNavigation' },
  ],
};
const clients: Record<string, string> = {
  admin: 'https://claude.ai/oauth/mcp-oauth-client-metadata',
  member: 'https://chatgpt.com/oauth/client.json',
  ungranted: 'https://claude.ai/oauth/mcp-oauth-client-metadata',
};

const base = Layer.provideMerge(SqliteRecordPersistenceLive, SqliteDbClient.live);
const repos = Layer.provideMerge(SqliteAuditHistoryRepoLive, Layer.provideMerge(SqliteAuditRepoLive, base));
const persistence = Layer.provideMerge(
  SqliteUserFlowAuditRepoLive,
  Layer.provideMerge(SqliteUserFlowAuditSchedulerLive, repos),
);

type ToolResult = {
  isError?: boolean;
  structuredContent?: Record<string, unknown>;
  content: ReadonlyArray<{ type: string; text: string }>;
};
const Tools = Schema.Struct({
  tools: Schema.Array(
    Schema.Struct({
      name: Schema.String,
      annotations: Schema.Struct({
        title: Schema.optional(Schema.String),
        readOnlyHint: Schema.Boolean,
        destructiveHint: Schema.Boolean,
        openWorldHint: Schema.Boolean,
      }),
    }),
  ),
});

describe('App Speed MCP server', () => {
  let db: PGlite;
  let directory: string;
  let runtime: ManagedRuntime.ManagedRuntime<Layer.Success<typeof persistence>, Layer.Error<typeof persistence>>;
  let app: { handler: (request: Request) => Promise<Response>; dispose: () => Promise<void> };
  let id = 0;

  const post = async (account: string | undefined, body: unknown, headers: Record<string, string> = {}) => {
    const response = await app.handler(
      new Request(resource, {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/event-stream',
          'Content-Type': 'application/json',
          ...(account ? { Authorization: `Bearer ${account}` } : {}),
          ...headers,
        },
        body: JSON.stringify(body),
      }),
    );
    return response;
  };
  const read = async (response: Response) => {
    const text = await response.text();
    if (!response.headers.get('content-type')?.includes('event-stream')) return JSON.parse(text);
    return text
      .split('\n')
      .filter((line) => line.startsWith('data: '))
      .map((line) => JSON.parse(line.slice(6)))
      .at(-1);
  };
  const sessions = new Map<string, Record<string, string>>();
  const session = async (account: string) => {
    const existing = sessions.get(account);
    if (existing) return existing;
    const init = await post(account, {
      jsonrpc: '2.0',
      id: ++id,
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: account === 'admin' ? 'claude-ai' : 'openai-mcp', version: '1.0.0' },
      },
    });
    expect(init.status).toBe(200);
    await read(init);
    const headers = {
      'Mcp-Session-Id': init.headers.get('mcp-session-id') ?? '',
      'MCP-Protocol-Version': '2025-11-25',
    };
    expect((await post(account, { jsonrpc: '2.0', method: 'notifications/initialized' }, headers)).status).toBe(202);
    sessions.set(account, headers);
    return headers;
  };
  const rpc = async (account: string, method: string, params: unknown) => {
    const message = await read(
      await post(account, { jsonrpc: '2.0', id: ++id, method, params }, await session(account)),
    );
    if (message.error) throw new Error(`${method} failed: ${JSON.stringify(message.error)}`);
    return message.result;
  };
  const call = (account: string, name: string, args: Record<string, unknown> = {}): Promise<ToolResult> =>
    rpc(account, 'tools/call', { name, arguments: args });
  const ok = async (account: string, name: string, args: Record<string, unknown> = {}) => {
    const result = await call(account, name, args);
    expect(result.isError, result.content[0]?.text).toBe(false);
    return result.structuredContent ?? {};
  };
  const failure = async (account: string, name: string, args: Record<string, unknown> = {}) => {
    const result = await call(account, name, args);
    expect(result.isError).toBe(true);
    return result.content[0]?.text ?? '';
  };

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'mcp-api-'));
    db = new PGlite();
    for (const migration of ['0004_workspaces_and_projects', '0005_workspace_logo'])
      await db.exec(await readFile(new URL(`../../migrations/${migration}.sql`, import.meta.url), 'utf8'));
    await db.query(`INSERT INTO accounts(id,email,name,image_url) VALUES
      ('admin','admin@example.com','Admin',''), ('member','member@example.com','Member',''),
      ('ungranted','ungranted@example.com','Ungranted','')`);
    await db.query("INSERT INTO workspaces(id,name) VALUES ($1,'PushBased')", [workspaceA]);
    await db.query(
      `INSERT INTO workspace_members(workspace_id,account_id,role) VALUES
      ($1,'admin','admin'),($1,'member','member'),($1,'ungranted','member')`,
      [workspaceA],
    );
    await db.query("INSERT INTO projects(id,workspace_id,name) VALUES ($1,$3,'Storefront'),($2,$3,'Docs')", [
      projectA,
      projectB,
      workspaceA,
    ]);
    await db.query("INSERT INTO project_members(workspace_id,project_id,account_id) VALUES ($1,$2,'member')", [
      workspaceA,
      projectA,
    ]);
    const config = Layer.succeed(
      ConfigProvider.ConfigProvider,
      ConfigProvider.fromUnknown({
        SQLITE_PATH: join(directory, 'audits.sqlite'),
        MCP_RESOURCE_URL: resource,
        CLERK_PUBLISHABLE_KEY: `pk_live_${Buffer.from('clerk.appspeed.dev$').toString('base64')}`,
        PORTAL_URL: 'https://appspeed.dev',
      }),
    );
    runtime = ManagedRuntime.make(persistence.pipe(Layer.provide(config)));
    app = HttpRouter.toWebHandler(
      McpLive.pipe(
        Layer.provide(Layer.succeedContext(await runtime.context())),
        Layer.provide(
          Layer.succeed(WorkspaceStore, { transaction: (use) => runWorkspaceTransaction(makeWorkspaceSql(db), use) }),
        ),
        Layer.provide(
          Layer.succeed(Identity, {
            authenticate: () => Effect.fail(new SignInRequired({ message: 'Portal sessions are not accepted' })),
            authenticateAgent: (authorization, audience) => {
              const account = authorization?.replace('Bearer ', '') ?? '';
              return audience === resource && clients[account]
                ? Effect.succeed({
                    account: { id: account, email: `${account}@example.com`, name: account, imageUrl: '' },
                    clientId: clients[account],
                    scopes: ['profile', 'email'],
                  })
                : Effect.fail(new SignInRequired({ message: 'Reconnect App Speed.' }));
            },
          }),
        ),
        Layer.provide(
          Layer.succeed(RunnerLifecycle, {
            requestActivation: Effect.void,
            requestInactivationIfQueueEmpty: () => Effect.succeed({ shouldTerminate: false }),
          }),
        ),
        Layer.provide(config),
        Layer.provide(NodeHttpServer.layerHttpServices),
      ),
      { disableLogger: true },
    );
  }, 30000);
  afterAll(async () => {
    await app?.dispose();
    await runtime?.dispose();
    await db?.close();
    await rm(directory, { recursive: true, force: true });
  });

  it('requires an OAuth token for the MCP resource', async () => {
    const response = await post(undefined, { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });
    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toContain(
      'resource_metadata="https://appspeed.dev/.well-known/oauth-protected-resource/mcp"',
    );
  });

  it('annotates every tool for client confirmation and directory review', async () => {
    const { tools } = Schema.decodeUnknownSync(Tools)(await rpc('member', 'tools/list', {}));
    const byName = new Map(tools.map((tool) => [tool.name, tool.annotations]));
    expect([...byName.keys()].sort()).toEqual(
      [
        'accept_invitation',
        'create_project',
        'create_workspace',
        'decline_invitation',
        'delete_project',
        'delete_workspace',
        'get_audit_status',
        'get_user_flow_audit',
        'get_user_flow_audit_result',
        'get_workspaces',
        'grant_project_access',
        'invite_member',
        'leave_workspace',
        'list_audits',
        'remove_member',
        'rename_project',
        'rename_workspace',
        'revoke_invitation',
        'revoke_project_access',
        'schedule_user_flow_audit',
        'set_member_role',
        'set_workspace_logo',
      ].sort(),
    );
    for (const annotations of byName.values()) expect(annotations.title).toBeTruthy();
    for (const name of ['get_workspaces', 'list_audits', 'get_audit_status', 'get_user_flow_audit_result'])
      expect(byName.get(name)).toMatchObject({ readOnlyHint: true, destructiveHint: false, openWorldHint: false });
    for (const name of ['delete_workspace', 'delete_project', 'remove_member', 'leave_workspace'])
      expect(byName.get(name)).toMatchObject({ readOnlyHint: false, destructiveHint: true });
    expect(byName.get('schedule_user_flow_audit')).toMatchObject({ destructiveHint: false, openWorldHint: true });
  });

  it('lists only the workspaces of the connected account', async () => {
    const overview = await ok('member', 'get_workspaces');
    expect(overview).toMatchObject({
      account: { id: 'member' },
      workspaces: [{ id: workspaceA, name: 'PushBased', role: 'member' }],
    });
  });

  it('schedules attributed project audits and enforces project access on every call', async () => {
    const scheduled = await ok('member', 'schedule_user_flow_audit', { projectId: projectA, audit: definition });
    expect(scheduled).toMatchObject({
      projectId: projectA,
      queuePosition: expect.any(Number),
      url: `https://appspeed.dev/audits/user-flow/${scheduled['auditId']}?projectId=${projectA}`,
    });
    const auditId = String(scheduled['auditId']);

    const page = await ok('member', 'list_audits', { projectId: projectA });
    expect(page['items']).toEqual([
      expect.objectContaining({ auditId, source: 'mcp', clientName: 'ChatGPT', status: 'SCHEDULED' }),
    ]);
    expect(await ok('admin', 'get_audit_status', { auditId, projectId: projectA })).toMatchObject({
      auditId,
      status: 'SCHEDULED',
      source: 'mcp',
      clientName: 'ChatGPT',
    });

    expect(await failure('ungranted', 'schedule_user_flow_audit', { projectId: projectA, audit: definition })).toMatch(
      /does not exist or you do not have access/,
    );
    expect(await failure('ungranted', 'list_audits', { projectId: projectA })).toMatch(/do not have access/);
    // An audit ID alone never reaches a project audit from Public View or another project.
    expect(await failure('member', 'get_audit_status', { auditId })).toMatch(/not found in this scope/);
    expect(await failure('admin', 'get_user_flow_audit', { auditId, projectId: projectB })).toMatch(/not found/);
    expect((await ok('member', 'list_audits'))['items']).toEqual([]);
  });

  it('summarizes completed results for the agent', async () => {
    const scheduled = await ok('admin', 'schedule_user_flow_audit', { audit: { ...definition, title: 'Public' } });
    const auditId = String(scheduled['auditId']);
    expect(await failure('admin', 'get_user_flow_audit_result', { auditId })).toMatch(/poll get_audit_status/);
    const run = Schema.decodeUnknownSync(AuditRunIdSchema)(auditId);
    await runtime.runPromise(
      Effect.gen(function* () {
        const repo = yield* UserFlowAuditRepo;
        yield* repo.completeSuccess(
          run,
          {
            flowResult: {
              steps: [
                {
                  name: 'Home',
                  lhr: {
                    gatherMode: 'navigation',
                    finalDisplayedUrl: 'https://example.com/',
                    categories: { performance: { score: 0.42 }, accessibility: { score: 1 } },
                    audits: {
                      'largest-contentful-paint': {
                        title: 'Largest Contentful Paint',
                        numericValue: 4200,
                        displayValue: '4.2 s',
                        score: 0.3,
                      },
                      'render-blocking-resources': {
                        title: 'Eliminate render-blocking resources',
                        score: 0.2,
                        displayValue: 'Potential savings of 900 ms',
                        details: { type: 'opportunity', overallSavingsMs: 900 },
                      },
                      'uses-text-compression': { title: 'Compression', score: 1, details: { type: 'opportunity' } },
                    },
                  },
                },
              ],
            },
            reportHtml: '<h1>Report</h1>',
          },
          1000,
        );
      }),
    );
    expect(await ok('member', 'get_user_flow_audit_result', { auditId })).toEqual({
      status: 'SUCCESS',
      url: `https://appspeed.dev/audits/user-flow/${auditId}`,
      steps: [
        {
          name: 'Home',
          gatherMode: 'navigation',
          url: 'https://example.com/',
          scores: { performance: 42, accessibility: 100, 'best-practices': null, seo: null },
          metrics: [
            {
              id: 'largest-contentful-paint',
              title: 'Largest Contentful Paint',
              value: 4200,
              displayValue: '4.2 s',
              score: 0.3,
            },
          ],
          opportunities: [
            {
              id: 'render-blocking-resources',
              title: 'Eliminate render-blocking resources',
              displayValue: 'Potential savings of 900 ms',
              score: 0.2,
              savingsMs: 900,
            },
          ],
        },
      ],
    });
    expect(await ok('member', 'get_user_flow_audit', { auditId })).toMatchObject({
      status: 'COMPLETE',
      audit: { title: 'Public' },
    });
  });

  it('manages workspaces with the account role and requires confirmation for destructive actions', async () => {
    expect(await failure('member', 'create_project', { workspaceId: workspaceA, name: 'Blog' })).toMatch(
      /do not have access/,
    );
    const created = await ok('admin', 'create_project', { workspaceId: workspaceA, name: 'Blog' });
    const projectId = String(created['id']);
    expect(await failure('admin', 'delete_project', { workspaceId: workspaceA, projectId, confirm: 'Docs' })).toMatch(
      /confirm does not match the project name/,
    );
    expect((await db.query('SELECT id FROM projects WHERE id=$1', [projectId])).rows).toHaveLength(1);
    await ok('admin', 'delete_project', { workspaceId: workspaceA, projectId, confirm: ' blog ' });
    expect((await db.query('SELECT id FROM projects WHERE id=$1', [projectId])).rows).toHaveLength(0);
    expect(await failure('admin', 'rename_workspace', { workspaceId: 'not-an-id', name: 'X' })).toMatch(
      /Invalid renameWorkspace request/,
    );
    await ok('admin', 'invite_member', { workspaceId: workspaceA, email: 'new@example.com', role: 'member' });
    const overview = await ok('admin', 'get_workspaces');
    const invitation = (overview['workspaces'] as Array<{ invitations: Array<{ id: string; email: string }> }>)[0]
      ?.invitations[0];
    expect(invitation?.email).toBe('new@example.com');
    await ok('admin', 'revoke_invitation', {
      workspaceId: workspaceA,
      invitationId: invitation?.id,
      confirm: 'new@example.com',
    });
  });

  it('serves the sessionless 2026-07-28 protocol', async () => {
    const response = await post(
      'member',
      {
        jsonrpc: '2.0',
        id: ++id,
        method: 'tools/call',
        params: {
          name: 'get_workspaces',
          arguments: {},
          _meta: {
            'io.modelcontextprotocol/protocolVersion': '2026-07-28',
            'io.modelcontextprotocol/clientCapabilities': {},
            'io.modelcontextprotocol/clientInfo': { name: 'openai-mcp', version: '1.0.0' },
          },
        },
      },
      { 'MCP-Protocol-Version': '2026-07-28', 'Mcp-Method': 'tools/call', 'Mcp-Name': 'get_workspaces' },
    );
    const message = await read(response);
    expect(message.result?.isError, JSON.stringify(message)).toBe(false);
    expect(message.result.structuredContent).toMatchObject({ account: { id: 'member' } });
  });
});
