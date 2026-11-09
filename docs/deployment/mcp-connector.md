# MCP connector release

App Speed exposes a remote MCP server at `https://appspeed.dev/mcp`. Signed-in users add it to Claude (web,
desktop, mobile, Claude Code) or ChatGPT as a custom connector and use App Speed with their own permissions.
See [ADR-0007](../adr/ADR-0007-mcp-server.md) for the design.

The endpoint exists only in production. The API serves it when `MCP_RESOURCE_URL` is set; the production
deployment sets `MCP_RESOURCE_URL=https://appspeed.dev/mcp` and `PORTAL_URL=https://appspeed.dev`.

## Hosting routes

Route these paths on `appspeed.dev` to the API container, like `/api`, without SPA fallback or caching:

| Path                                        | Methods           | Purpose                                    |
| ------------------------------------------- | ----------------- | ------------------------------------------ |
| `/mcp`                                      | POST, GET, DELETE | Streamable HTTP MCP endpoint (bearer auth) |
| `/.well-known/oauth-protected-resource/mcp` | GET               | RFC 9728 protected resource metadata       |
| `/.well-known/oauth-protected-resource`     | GET               | Same document for clients using the root   |

Forward the `Authorization`, `Mcp-Session-Id`, `MCP-Protocol-Version`, `Mcp-Method` and `Mcp-Name` request
headers, and the `WWW-Authenticate` and `Mcp-Session-Id` response headers. Do not buffer `text/event-stream`
responses.

## Clerk production instance

The authorization server is the Clerk Frontend API derived from `CLERK_PUBLISHABLE_KEY` (for example
`https://clerk.appspeed.dev`). Set `MCP_AUTHORIZATION_SERVER` only to override it.

1. **Agents → MCP servers → Add MCP server**: enter `https://appspeed.dev/mcp` exactly, without a trailing slash.
   Clerk then issues access tokens with that audience; the API rejects tokens for any other audience.
2. **OAuth applications → Settings**:
   - Enable **Allow public clients to connect** and **Publish CIMD support** (Client ID Metadata Documents).
   - Set **Client admission** to accept any CIMD client. The consent screen is the gate.
   - Optionally enable **Publish DCR support** for clients without CIMD. Keep the default scopes at
     `profile email`.
3. Keep the consent screen reachable. CIMD clients always see Clerk's consent page, and sign-in during the OAuth
   flow uses the configured `/sign-in` page.
4. Allowlist these redirect URIs if the instance restricts them:
   - Claude: `https://claude.ai/api/mcp/auth_callback` and `https://claude.com/api/mcp/auth_callback`
   - Claude Code: loopback `http://localhost/callback` and `http://127.0.0.1/callback` (any port)
   - ChatGPT: `https://chatgpt.com/connector_platform_oauth_redirect` (and `https://chatgpt.com/connector/oauth/*`
     when the authorization server does not return `iss`)

Before rollout, confirm that `https://<clerk-frontend-api>/.well-known/oauth-authorization-server` lists
`client_id_metadata_document_supported: true` and `"none"` in `token_endpoint_auth_methods_supported`. Claude
falls back to DCR otherwise.

## Verification

1. `curl -i https://appspeed.dev/.well-known/oauth-protected-resource/mcp` returns the metadata JSON with the Clerk
   authorization server.
2. `curl -i -X POST https://appspeed.dev/mcp` returns `401` with
   `WWW-Authenticate: Bearer resource_metadata="https://appspeed.dev/.well-known/oauth-protected-resource/mcp", …`.
3. In Claude, **Settings → Connectors → Add custom connector** with `https://appspeed.dev/mcp`; sign in and approve
   the consent screen. Ask it to list your workspaces and schedule an audit in a project.
4. In ChatGPT, enable developer mode, add a custom MCP server with the same URL, connect, and repeat step 3.
5. In Claude Code, run `/plugin marketplace add ChristopherPHolder/app-speed`, install `app-speed`, and run
   `/mcp` to authenticate.
6. Open the audit history in the portal and check that the audit shows **via Claude** / **via ChatGPT**.
7. Verify that a second account cannot read the first account's project audits through the connector.

## Rollout order

Apply the `0007_audit_run_source` Postgres migration (the deploy workflow runs `api:migrate`) before the API
image starts. Existing runs become `source = 'portal'`. Configure Clerk and the hosting routes, then deploy.
Until the routes exist, the endpoint is unreachable and nothing else changes.
