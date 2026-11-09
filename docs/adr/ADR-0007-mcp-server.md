# ADR-0007: MCP server for AI clients

Status: Accepted
Date: 2026-11-09

## Context

Users want to drive App Speed from Claude and ChatGPT: schedule audits, read results and manage workspaces, with
the same permissions as the portal. Both clients install remote MCP servers as connectors and authenticate with
OAuth 2.1. Tracked in [#244](https://github.com/ChristopherPHolder/app-speed/issues/244).

## Decision

The API serves a Streamable HTTP MCP endpoint at `https://appspeed.dev/mcp` (production only) using
`effect/ai` `McpServer.layerHttp` on the existing `HttpRouter`. It accepts MCP `2025-06-18`, `2025-11-25` and
the sessionless `2026-07-28` revision.

**Authentication.** Clerk is the OAuth authorization server. The API is an OAuth protected resource. It publishes
RFC 9728 metadata, answers unauthenticated requests with `401` and a `WWW-Authenticate` challenge, and verifies
Clerk OAuth access tokens (`acceptsToken: 'oauth_token'`) whose audience is the MCP resource URL. Portal session
tokens are rejected on `/mcp`, and OAuth tokens are rejected on `/api`. Clients register with Client ID Metadata
Documents; any client may connect, and Clerk's consent screen is the gate. There is one scope set
(`profile email`). Workspace roles and project grants remain the only authorization boundary.

**Stateless context.** Tools take explicit `workspaceId` and `projectId` arguments. Every call re-checks
membership and project access, exactly like ADR-0006. Audit tools without `projectId` act in Public View. An audit
ID never grants access by itself: the stored owner must match the requested scope.

**Tools.** Each domain owns its toolkit next to its api-runtime: workspace management in
`libs/workspace/api-runtime`, audit history and status in `libs/audit/core/api-runtime`, and user-flow scheduling
and results in `libs/audit/user-flow/api-runtime`. `libs/platform/mcp` owns the transport, OAuth metadata, token
middleware, caller identity and client naming. `apps/api` composes them. Every tool declares `title`,
`readOnlyHint`, `destructiveHint`, `idempotentHint` and `openWorldHint`. Destructive tools also require a `confirm`
argument matching the target's name or email, which is never revealed in errors. Long audits are scheduled and
then polled. Results are summarized (scores, metrics, opportunities) and link to the portal report. The full
Lighthouse JSON is never returned.

**Attribution.** Audit runs store `source` (`portal` or `mcp`), the OAuth `client_id` and a display name
(Claude, ChatGPT, Claude Code, …) derived from the client id and MCP `clientInfo`. History shows "via …" for MCP
runs. Workspace actions record the client on their tracing span only.

**Distribution.** Users add the URL as a custom connector. This repository is also a Claude Code marketplace
(`.claude-plugin/marketplace.json`) with an `app-speed` plugin that bundles the server and a performance-audit
skill.

## Consequences

- `/mcp` and `/.well-known/oauth-protected-resource*` must be routed to the API, and Clerk must be configured
  (see [the release guide](../deployment/mcp-connector.md)).
- MCP clients share the account's full permissions. Finer scopes would need custom Clerk scopes and `403`
  step-up challenges.
- MCP Apps (embedded UI), directory submissions, a development-environment endpoint and elicitation-based
  confirmation are deferred.
