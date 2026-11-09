import { createClerkClient, type ClerkClient } from '@clerk/backend';
import { Config, Context, Effect, Layer, Option, Redacted, Schema } from 'effect';

export class SignInRequired extends Schema.TaggedError<SignInRequired>()(
  'SignInRequired',
  { message: Schema.String },
  { httpApiStatus: 401 },
) {}

export class IdentityUnavailable extends Schema.TaggedError<IdentityUnavailable>()(
  'IdentityUnavailable',
  { message: Schema.String },
  { httpApiStatus: 503 },
) {}

export interface AccountIdentity {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly imageUrl: string;
}

/** An account acting through an OAuth client, such as Claude or ChatGPT connected over MCP. */
export interface AgentIdentity {
  readonly account: AccountIdentity;
  readonly clientId: string;
  readonly scopes: ReadonlyArray<string>;
}

export class Identity extends Context.Service<
  Identity,
  {
    readonly authenticate: (
      authorization: string | undefined,
    ) => Effect.Effect<AccountIdentity, SignInRequired | IdentityUnavailable>;
    /**
     * Verifies a Clerk OAuth access token issued for `audience` (the MCP resource URL). Session tokens are rejected:
     * a portal session must never be replayable against the MCP endpoint, and vice versa.
     */
    readonly authenticateAgent: (
      authorization: string | undefined,
      audience: string,
    ) => Effect.Effect<AgentIdentity, SignInRequired | IdentityUnavailable>;
  }
>()('Identity') {}

/**
 * Derives the Clerk Frontend API origin, which is the OAuth authorization server, from a publishable key
 * (`pk_<env>_<base64("<frontend-api-host>$")>`).
 */
export const clerkFrontendApiUrl = (publishableKey: string): string | undefined => {
  const [, , encoded] = publishableKey.trim().split('_');
  if (!encoded) return undefined;
  try {
    const host = Buffer.from(encoded, 'base64').toString('utf8');
    if (!host.endsWith('$')) return undefined;
    const origin = new URL(`https://${host.slice(0, -1)}`);
    return origin.origin;
  } catch {
    return undefined;
  }
};

const loadAccount = (clerk: ClerkClient, userId: string) =>
  Effect.gen(function* () {
    const user = yield* Effect.tryPromise({
      try: () => clerk.users.getUser(userId),
      catch: () => new IdentityUnavailable({ message: 'Your account could not be loaded. Please try again.' }),
    });
    const email = user.emailAddresses.find(
      (item) => item.id === user.primaryEmailAddressId && item.verification?.status === 'verified',
    );
    if (!email)
      return yield* new SignInRequired({
        message: 'Verify your primary email address before managing workspaces.',
      });
    return {
      id: user.id,
      email: email.emailAddress.toLowerCase(),
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || email.emailAddress,
      imageUrl: user.hasImage ? user.imageUrl : '',
    } satisfies AccountIdentity;
  });

export const IdentityLive = Layer.effect(Identity)(
  Effect.gen(function* () {
    const secret = yield* Config.option(Config.Redacted('CLERK_SECRET_KEY'));
    const publishableKey = yield* Config.String('CLERK_PUBLISHABLE_KEY').pipe(Config.withDefault(''));
    const parties = yield* Config.String('CLERK_AUTHORIZED_PARTIES').pipe(Config.withDefault('http://localhost:4200'));
    const authorizedParties = parties
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const clerk =
      Option.isSome(secret) && publishableKey.trim()
        ? createClerkClient({ secretKey: Redacted.value(secret.value), publishableKey: publishableKey.trim() })
        : undefined;
    return {
      authenticate: Effect.fn('identity.authenticate')(function* (authorization: string | undefined) {
        if (!authorization?.startsWith('Bearer '))
          return yield* new SignInRequired({ message: 'Sign in to manage workspaces.' });
        if (!clerk || authorizedParties.length === 0)
          return yield* new IdentityUnavailable({ message: 'Workspace sign-in is not configured on the server.' });
        const state = yield* Effect.tryPromise({
          try: () =>
            clerk.authenticateRequest(
              new Request(`${authorizedParties[0]}/api/workspaces`, { headers: { authorization } }),
              {
                authorizedParties,
                acceptsToken: 'session_token',
              },
            ),
          catch: () => new SignInRequired({ message: 'Your session could not be verified. Please sign in again.' }),
        });
        const auth = state.toAuth();
        if (!auth?.userId)
          return yield* new SignInRequired({ message: 'Your session has expired. Please sign in again.' });
        return yield* loadAccount(clerk, auth.userId);
      }),
      authenticateAgent: Effect.fn('identity.authenticateAgent')(function* (
        authorization: string | undefined,
        audience: string,
      ) {
        if (!authorization?.startsWith('Bearer '))
          return yield* new SignInRequired({ message: 'Connect your App Speed account to continue.' });
        if (!clerk) return yield* new IdentityUnavailable({ message: 'Sign-in is not configured on the server.' });
        const state = yield* Effect.tryPromise({
          try: () =>
            clerk.authenticateRequest(new Request(audience, { headers: { authorization } }), {
              acceptsToken: 'oauth_token',
              audience,
            }),
          catch: () => new SignInRequired({ message: 'Your connection could not be verified. Please reconnect.' }),
        });
        const auth = state.toAuth();
        if (!auth || auth.tokenType !== 'oauth_token' || !auth.isAuthenticated || !auth.userId || !auth.clientId)
          return yield* new SignInRequired({ message: 'Your connection has expired. Please reconnect.' });
        yield* Effect.annotateCurrentSpan({ 'auth.client_id': auth.clientId });
        return {
          account: yield* loadAccount(clerk, auth.userId),
          clientId: auth.clientId,
          scopes: auth.scopes,
        } satisfies AgentIdentity;
      }),
    };
  }),
);
