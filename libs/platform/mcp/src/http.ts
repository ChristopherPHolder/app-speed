import { Config, Effect, Layer, Option, Schema } from 'effect';
import { McpProtocol, McpServer } from 'effect/ai';
import { HttpRouter, HttpServerRequest, HttpServerResponse } from 'effect/http';
import {
  clerkFrontendApiUrl,
  Identity,
  type IdentityUnavailable,
  type SignInRequired,
} from '@app-speed/platform/identity';

import { McpCaller } from './caller';

const scopes = ['profile', 'email'] as const;

export class McpConfigurationError extends Schema.TaggedError<McpConfigurationError>()('McpConfigurationError', {
  message: Schema.String,
}) {}

export interface McpHttpOptions<RA, RE, RR> {
  readonly name: string;
  readonly version: string;
  readonly title?: string;
  readonly instructions?: string;
  readonly websiteUrl?: string;
  readonly registrations: Layer.Layer<RA, RE, RR>;
}

/** RFC 9728 protected resource metadata for the MCP endpoint. */
export const mcpResourceMetadata = (options: {
  readonly resource: string;
  readonly authorizationServer: string;
  readonly name: string;
  readonly websiteUrl?: string | undefined;
}) => ({
  resource: options.resource,
  authorization_servers: [options.authorizationServer],
  scopes_supported: [...scopes],
  bearer_methods_supported: ['header'],
  resource_name: options.name,
  ...(options.websiteUrl ? { resource_documentation: options.websiteUrl } : {}),
});

const challenge = (metadataUrl: string, error?: { code: string; description: string }) =>
  [
    `Bearer resource_metadata="${metadataUrl}"`,
    `scope="${scopes.join(' ')}"`,
    ...(error ? [`error="${error.code}"`, `error_description="${error.description.replaceAll('"', "'")}"`] : []),
  ].join(', ');

/** Maps an authentication failure to an OAuth error response; configuration problems are not client errors. */
const rejection =
  (metadataUrl: string, authorization: string | undefined) => (error: SignInRequired | IdentityUnavailable) =>
    error._tag === 'IdentityUnavailable'
      ? HttpServerResponse.jsonUnsafe(
          { error: 'temporarily_unavailable', error_description: error.message },
          { status: 503, headers: { 'Cache-Control': 'no-store' } },
        )
      : HttpServerResponse.jsonUnsafe(
          { error: 'invalid_token', error_description: error.message },
          {
            status: 401,
            headers: {
              'Cache-Control': 'no-store',
              'WWW-Authenticate': challenge(
                metadataUrl,
                authorization ? { code: 'invalid_token', description: error.message } : undefined,
              ),
            },
          },
        );

/**
 * Serves a Streamable HTTP MCP endpoint protected by Clerk OAuth access tokens.
 *
 * The endpoint is disabled unless `MCP_RESOURCE_URL` (the exact URL clients connect to, e.g.
 * `https://appspeed.dev/mcp`) is configured. Tokens must carry that URL as audience. The authorization server is the
 * Clerk Frontend API derived from `CLERK_PUBLISHABLE_KEY`, or `MCP_AUTHORIZATION_SERVER` when set.
 */
export const McpHttpLive = <RA, RE, RR>(options: McpHttpOptions<RA, RE, RR>) =>
  Layer.unwrap(
    Effect.gen(function* () {
      const configured = yield* Config.option(Config.URL('MCP_RESOURCE_URL'));
      if (Option.isNone(configured)) return Layer.empty;
      const resourceUrl = configured.value;
      // Clients compare resource identifiers exactly; a trailing slash would be a different audience.
      const resource = resourceUrl.href.replace(/\/$/, '');
      const path: `/${string}` = `/${resourceUrl.pathname.replace(/^\/|\/$/g, '')}`;
      const publishableKey = yield* Config.String('CLERK_PUBLISHABLE_KEY').pipe(Config.withDefault(''));
      const override = yield* Config.option(Config.URL('MCP_AUTHORIZATION_SERVER'));
      const authorizationServer = Option.orElse(
        Option.map(override, (url) => url.origin),
        () => clerkFrontendApiUrl(publishableKey),
      );
      if (Option.isNone(authorizationServer))
        return yield* new McpConfigurationError({
          message: 'MCP_RESOURCE_URL requires CLERK_PUBLISHABLE_KEY or MCP_AUTHORIZATION_SERVER to be configured.',
        });
      const metadataPath: `/${string}` = `/.well-known/oauth-protected-resource${path === '/' ? '' : path}`;
      const metadataUrl = `${resourceUrl.origin}${metadataPath}`;
      const metadataResponse = HttpServerResponse.jsonUnsafe(
        mcpResourceMetadata({
          resource,
          authorizationServer: authorizationServer.value,
          name: options.title ?? options.name,
          websiteUrl: options.websiteUrl,
        }),
        { headers: { 'Cache-Control': 'public, max-age=3600', 'Access-Control-Allow-Origin': '*' } },
      );

      const Authentication = HttpRouter.middleware<{ provides: McpCaller }>()(
        Effect.gen(function* () {
          const identity = yield* Identity;
          return Effect.fnUntraced(function* <E, R>(
            httpEffect: Effect.Effect<HttpServerResponse.HttpServerResponse, E, R>,
          ) {
            const authorization = (yield* HttpServerRequest.HttpServerRequest).headers['authorization'];
            return yield* identity.authenticateAgent(authorization, resource).pipe(
              Effect.matchEffect({
                onFailure: (error) => Effect.succeed(rejection(metadataUrl, authorization)(error)),
                onSuccess: (agent) => Effect.provideService(httpEffect, McpCaller, agent),
              }),
            );
          });
        }),
      );

      const Metadata = Layer.mergeAll(
        HttpRouter.add('GET', metadataPath, metadataResponse),
        // Clients that ignore the path-specific location fall back to the root document.
        ...(metadataPath === '/.well-known/oauth-protected-resource'
          ? []
          : [HttpRouter.add('GET', '/.well-known/oauth-protected-resource', metadataResponse)]),
      );

      const Server = McpServer.layerHttp({
        name: options.name,
        version: options.version,
        instructions: options.instructions,
        websiteUrl: options.websiteUrl,
        path,
        protocols: [McpProtocol.v2025_06_18, McpProtocol.v2025_11_25, McpProtocol.v2026_07_28],
        allowSessionTermination: true,
        registrations: options.registrations,
      }).pipe(Layer.provide(Authentication.layer));

      return Layer.mergeAll(Metadata, Server);
    }),
  );
