import { Layer } from 'effect';
import { AuditMcpLive } from '@app-speed/audit/core/api-runtime';
import { UserFlowMcpLive } from '@app-speed/audit/user-flow/api-runtime';
import { McpHttpLive } from '@app-speed/platform/mcp';
import { WorkspaceMcpLive } from '@app-speed/workspace/api-runtime';

const instructions = `App Speed runs Lighthouse user-flow performance audits in a real browser.

- Start with get_workspaces to find workspace and project IDs. Pass projectId to audit tools to work inside a
  project; omit it for Public View, whose audits are visible to everyone.
- schedule_user_flow_audit returns immediately. Poll get_audit_status until status is COMPLETE, then call
  get_user_flow_audit_result. Share the returned url so the user can open the full report.
- Destructive workspace tools need a confirm argument that matches the target's name. Ask the user first.`;

/** The `/mcp` endpoint, enabled when `MCP_RESOURCE_URL` is configured. */
export const McpLive = McpHttpLive({
  name: 'app-speed',
  title: 'App Speed',
  version: '1.0.0',
  websiteUrl: 'https://appspeed.dev',
  instructions,
  registrations: Layer.mergeAll(WorkspaceMcpLive, AuditMcpLive, UserFlowMcpLive),
});
