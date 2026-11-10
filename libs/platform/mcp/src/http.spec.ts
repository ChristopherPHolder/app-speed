import { ConfigProvider, Effect, Layer, Schema } from 'effect';
import { McpServer, Tool, Toolkit } from 'effect/ai';
import { HttpRouter } from 'effect/http';
import { Identity, IdentityUnavailable, SignInRequired } from '@app-speed/platform/identity';

import { currentMcpClient, describeMcpClient, McpCaller, McpToolError } from './index';
import { McpHttpLive } from './http';

const WhoAmI = Tool.make('who_am_i', {
  success: Schema.Struct({ id: Schema.String, client: Schema.String }),
  failure: McpToolError,
  dependencies: [McpCaller],
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false);
const Fail = Tool.make('fail', { failure: McpToolError, dependencies: [McpCaller] });
const Tools = Toolkit.make(WhoAmI, Fail);
const Registrations = McpServer.toolkit(Tools).pipe(
  Layer.provide(
    Tools.toLayer({
      who_am_i: () => Effect.map(currentMcpClient, (client) => ({ id: client.account.id, client: client.clientName })),
      fail: () => Effect.fail(new McpToolError({ message: 'You do not have access to this project.' })),
    }),
  ),
);

const resource = 'https://appspeed.dev/mcp';
const key = `pk_live_${Buffer.from('clerk.appspeed.dev$').toString('base64').replace(/=+$/, '')}`;

const makeApp = (env: Record<string, string>, unavailable = false) =>
  HttpRouter.toWebHandler(
    McpHttpLive({ name: 'app-speed', title: 'App Speed', version: '1.0.0', registrations: Registrations }).pipe(
      Layer.provide(
        Layer.succeed(Identity, {
          authenticate: () => Effect.fail(new SignInRequired({ message: 'Session tokens are not accepted.' })),
          authenticateAgent: (authorization, audience) => {
            if (unavailable) return Effect.fail(new IdentityUnavailable({ message: 'Sign-in is not configured.' }));
            if (audience !== resource || authorization !== 'Bearer oauth-token')
              return Effect.fail(new SignInRequired({ message: 'Your connection has expired. Please reconnect.' }));
            return Effect.succeed({
              account: { id: 'user_chris', email: 'chris@example.com', name: 'Chris', imageUrl: '' },
              clientId: 'https://chatgpt.com/oauth/client.json',
              scopes: ['profile', 'email'],
            });
          },
        }),
      ),
      Layer.provide(Layer.succeed(ConfigProvider.ConfigProvider, ConfigProvider.fromUnknown(env))),
    ),
    { disableLogger: true },
  );

const rpc = (method: string, params: unknown, id: number) => ({ jsonrpc: '2.0', id, method, params });
const readJsonRpc = async (response: Response) => {
  const text = await response.text();
  if (!response.headers.get('content-type')?.includes('event-stream')) return JSON.parse(text);
  const data = text
    .split('\n')
    .filter((line) => line.startsWith('data: '))
    .map((line) => JSON.parse(line.slice(6)));
  return data.at(-1);
};

describe('MCP HTTP endpoint', () => {
  const configured = { MCP_RESOURCE_URL: resource, CLERK_PUBLISHABLE_KEY: key };
  let app: ReturnType<typeof makeApp>;
  beforeAll(() => {
    app = makeApp(configured);
  });
  afterAll(async () => {
    await app.dispose();
  });

  const post = (body: unknown, headers: Record<string, string> = {}) =>
    app.handler(
      new Request(resource, {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/event-stream',
          'Content-Type': 'application/json',
          Authorization: 'Bearer oauth-token',
          ...headers,
        },
        body: JSON.stringify(body),
      }),
    );

  const session = async () => {
    const init = await post(
      rpc(
        'initialize',
        {
          protocolVersion: '2025-11-25',
          capabilities: {},
          clientInfo: { name: 'openai-mcp', version: '1.0.0' },
        },
        1,
      ),
    );
    expect(init.status).toBe(200);
    const sessionId = init.headers.get('mcp-session-id') ?? '';
    await readJsonRpc(init);
    const headers = { 'Mcp-Session-Id': sessionId, 'MCP-Protocol-Version': '2025-11-25' };
    const initialized = await post({ jsonrpc: '2.0', method: 'notifications/initialized' }, headers);
    expect(initialized.status).toBe(202);
    return headers;
  };

  it('publishes protected resource metadata pointing at Clerk', async () => {
    for (const path of ['/.well-known/oauth-protected-resource/mcp', '/.well-known/oauth-protected-resource']) {
      const response = await app.handler(new Request(`https://appspeed.dev${path}`));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        resource,
        authorization_servers: ['https://clerk.appspeed.dev'],
        scopes_supported: ['profile', 'email'],
        bearer_methods_supported: ['header'],
        resource_name: 'App Speed',
      });
    }
  });

  it('challenges anonymous and invalid tokens with the resource metadata location', async () => {
    const anonymous = await post(rpc('tools/list', {}, 1), { Authorization: '' });
    expect(anonymous.status).toBe(401);
    expect(anonymous.headers.get('www-authenticate')).toBe(
      'Bearer resource_metadata="https://appspeed.dev/.well-known/oauth-protected-resource/mcp", scope="profile email"',
    );
    const invalid = await post(rpc('tools/list', {}, 1), { Authorization: 'Bearer session-token' });
    expect(invalid.status).toBe(401);
    expect(invalid.headers.get('www-authenticate')).toContain('error="invalid_token"');
  });

  it('reports server configuration problems without challenging the client', async () => {
    const unavailable = makeApp(configured, true);
    try {
      const response = await unavailable.handler(
        new Request(resource, { method: 'POST', headers: { Authorization: 'Bearer oauth-token' }, body: '{}' }),
      );
      expect(response.status).toBe(503);
    } finally {
      await unavailable.dispose();
    }
  });

  it('runs tools as the verified account and returns tool errors to the model', async () => {
    const headers = await session();
    const list = await readJsonRpc(await post(rpc('tools/list', {}, 2), headers));
    expect(list.result.tools.find((tool: { name: string }) => tool.name === 'who_am_i').annotations).toMatchObject({
      readOnlyHint: true,
      destructiveHint: false,
    });
    const call = await readJsonRpc(await post(rpc('tools/call', { name: 'who_am_i', arguments: {} }, 3), headers));
    expect(call.result.structuredContent).toEqual({ id: 'user_chris', client: 'ChatGPT' });
    const failed = await readJsonRpc(await post(rpc('tools/call', { name: 'fail', arguments: {} }, 4), headers));
    expect(failed.result).toMatchObject({
      isError: true,
      content: [{ type: 'text', text: 'You do not have access to this project.' }],
    });
  });

  it('disables the endpoint instead of failing when no authorization server can be derived', async () => {
    const misconfigured = makeApp({ MCP_RESOURCE_URL: resource, CLERK_PUBLISHABLE_KEY: 'pk_live_not base64!' });
    try {
      expect((await misconfigured.handler(new Request(resource, { method: 'POST' }))).status).toBe(404);
    } finally {
      await misconfigured.dispose();
    }
  });

  it('is disabled until a resource URL is configured', async () => {
    const disabled = makeApp({ CLERK_PUBLISHABLE_KEY: key });
    try {
      expect((await disabled.handler(new Request(resource, { method: 'POST' }))).status).toBe(404);
    } finally {
      await disabled.dispose();
    }
  });
});

describe('MCP client attribution', () => {
  it.each([
    ['https://claude.ai/oauth/mcp-oauth-client-metadata', 'claude-ai', 'Claude'],
    ['https://claude.ai/oauth/claude-code-client-metadata', 'claude-code', 'Claude Code'],
    ['https://chatgpt.com/oauth/client.json', 'openai-mcp', 'ChatGPT'],
    ['https://cursor.com/oauth/client.json', 'Cursor', 'Cursor'],
    ['https://vscode.dev/oauth/client.json', undefined, 'vscode.dev'],
    ['opaque_client_id', undefined, 'MCP client'],
  ])('names %s (%s) as %s', (clientId, info, name) => {
    expect(describeMcpClient(clientId, info)).toBe(name);
  });
});
