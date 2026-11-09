import { Context, Effect, Option, Schema } from 'effect';
import { McpSchema } from 'effect/ai';
import type { AccountIdentity, AgentIdentity } from '@app-speed/platform/identity';

/** The verified account and OAuth client behind the current MCP request. Provided by the `/mcp` HTTP middleware. */
export class McpCaller extends Context.Service<McpCaller, AgentIdentity>()('McpCaller') {}

/**
 * A failure the model should see and can act on (missing access, invalid input, conflicts). Its message is returned
 * as an `isError` tool result instead of a JSON-RPC error.
 */
export class McpToolError extends Schema.TaggedError<McpToolError>()('McpToolError', { message: Schema.String }) {}

/** Maps domain errors that carry a user-facing message to a tool error. */
export const toolError = (error: { readonly message: string }) => new McpToolError({ message: error.message });

export interface McpClient {
  readonly account: AccountIdentity;
  readonly clientId: string;
  /** Human-readable client, e.g. "Claude", "ChatGPT" or "Claude Code". */
  readonly clientName: string;
}

const knownHosts: ReadonlyArray<readonly [RegExp, string]> = [
  [/(^|\.)claude\.(ai|com)$/, 'Claude'],
  [/(^|\.)anthropic\.com$/, 'Claude'],
  [/(^|\.)(chatgpt|openai)\.com$/, 'ChatGPT'],
];

/**
 * Names the client for attribution. Client ID Metadata Document clients use their metadata URL as OAuth client id;
 * the MCP `clientInfo` name distinguishes clients that share a host, such as Claude Code.
 */
export const describeMcpClient = (clientId: string, clientInfoName?: string): string => {
  const info = clientInfoName?.trim() ?? '';
  if (/claude[\s_-]?code/i.test(info)) return 'Claude Code';
  const host = URL.canParse(clientId) ? new URL(clientId).hostname.toLowerCase() : '';
  for (const [pattern, name] of knownHosts) if (pattern.test(host)) return name;
  if (/chatgpt|openai/i.test(info)) return 'ChatGPT';
  if (/claude|anthropic/i.test(info)) return 'Claude';
  if (info) return info.slice(0, 60);
  return host ? host.slice(0, 60) : 'MCP client';
};

export const currentMcpClient = Effect.gen(function* () {
  const caller = yield* McpCaller;
  const context = yield* Effect.serviceOption(McpSchema.McpRequestContext);
  const clientInfo = Option.getOrUndefined(context)?.clientInfo;
  return {
    account: caller.account,
    clientId: caller.clientId,
    clientName: describeMcpClient(caller.clientId, clientInfo?.title ?? clientInfo?.name),
  } satisfies McpClient;
});
