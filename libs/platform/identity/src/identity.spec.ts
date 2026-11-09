import { it, describe, expect } from '@effect/vitest';
import { ConfigProvider, Effect, Option } from 'effect';
import { clerkFrontendApiUrl, Identity, IdentityLive } from './index';

const { clerk, createClerkClient } = vi.hoisted(() => {
  const clerk = { authenticateRequest: vi.fn(), users: { getUser: vi.fn() } };
  return { clerk, createClerkClient: vi.fn(() => clerk) };
});
vi.mock('@clerk/backend', () => ({ createClerkClient }));

const withIdentity = <A, E>(
  use: (identity: Identity['Service']) => Effect.Effect<A, E>,
  configured = true,
  publishableKey = 'test_publishable_key',
) =>
  Effect.gen(function* () {
    return yield* use(yield* Identity);
  }).pipe(
    Effect.provide(IdentityLive),
    Effect.provideService(
      ConfigProvider.ConfigProvider,
      ConfigProvider.fromEnv({
        env: configured
          ? {
              CLERK_SECRET_KEY: 'test_server_key',
              CLERK_PUBLISHABLE_KEY: publishableKey,
              CLERK_AUTHORIZED_PARTIES: 'http://localhost:4200',
            }
          : {},
      }),
    ),
  );
const authenticate = (authorization: string | undefined, configured = true, publishableKey = 'test_publishable_key') =>
  withIdentity((identity) => identity.authenticate(authorization), configured, publishableKey);
const resource = 'https://appspeed.dev/mcp';
const authenticateAgent = (authorization: string | undefined, configured = true) =>
  withIdentity((identity) => identity.authenticateAgent(authorization, resource), configured);

describe('Clerk identity boundary', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clerk.authenticateRequest.mockResolvedValue({ toAuth: () => ({ userId: 'user_chris' }) });
    clerk.users.getUser.mockResolvedValue({
      id: 'user_chris',
      primaryEmailAddressId: 'email_verified',
      emailAddresses: [
        { id: 'email_verified', emailAddress: 'CHRIS@EXAMPLE.COM', verification: { status: 'verified' } },
      ],
      firstName: 'Chris',
      lastName: 'Holder',
      hasImage: true,
      imageUrl: 'https://example.com/avatar.png',
    });
  });

  it.effect('rejects anonymous requests without calling Clerk', () =>
    authenticate(undefined).pipe(
      Effect.flip,
      Effect.map((error) => {
        expect(error._tag).toBe('SignInRequired');
        expect(clerk.authenticateRequest).not.toHaveBeenCalled();
      }),
    ),
  );
  it.effect('reports unavailable configuration without granting access', () =>
    authenticate('Bearer token', false).pipe(
      Effect.flip,
      Effect.map((error) => {
        expect(error._tag).toBe('IdentityUnavailable');
      }),
    ),
  );
  it.effect('reports missing publishable key as a server configuration problem', () =>
    authenticate('Bearer token', true, '').pipe(
      Effect.flip,
      Effect.map((error) => {
        expect(error._tag).toBe('IdentityUnavailable');
        expect(clerk.authenticateRequest).not.toHaveBeenCalled();
      }),
    ),
  );
  it.effect('verifies the session for the configured portal and loads account data from Clerk', () =>
    authenticate('Bearer token').pipe(
      Effect.map((account) => {
        expect(account).toEqual({
          id: 'user_chris',
          email: 'chris@example.com',
          name: 'Chris Holder',
          imageUrl: 'https://example.com/avatar.png',
        });
        expect(createClerkClient).toHaveBeenCalledWith({
          secretKey: 'test_server_key',
          publishableKey: 'test_publishable_key',
        });
        expect(clerk.authenticateRequest).toHaveBeenCalledWith(expect.any(Request), {
          authorizedParties: ['http://localhost:4200'],
          acceptsToken: 'session_token',
        });
        expect(clerk.users.getUser).toHaveBeenCalledWith('user_chris');
      }),
    ),
  );
  it.effect('rejects an invalid or expired session', () => {
    clerk.authenticateRequest.mockResolvedValueOnce({ toAuth: () => undefined });
    return authenticate('Bearer invalid').pipe(
      Effect.flip,
      Effect.map((error) => {
        expect(error._tag).toBe('SignInRequired');
        expect(clerk.users.getUser).not.toHaveBeenCalled();
      }),
    );
  });
  it.effect('rejects accounts without a verified primary email', () => {
    clerk.users.getUser.mockResolvedValueOnce({
      id: 'user_chris',
      primaryEmailAddressId: 'email_unverified',
      emailAddresses: [
        { id: 'email_unverified', emailAddress: 'chris@example.com', verification: { status: 'unverified' } },
      ],
    });
    return authenticate('Bearer token').pipe(
      Effect.flip,
      Effect.map((error) => expect(error._tag).toBe('SignInRequired')),
    );
  });

  describe('OAuth agent tokens', () => {
    beforeEach(() => {
      clerk.authenticateRequest.mockResolvedValue({
        toAuth: () => ({
          tokenType: 'oauth_token',
          isAuthenticated: true,
          userId: 'user_chris',
          clientId: 'https://claude.ai/oauth/mcp-oauth-client-metadata',
          scopes: ['profile', 'email'],
        }),
      });
    });
    it.effect('accepts only OAuth tokens issued for the MCP resource', () =>
      authenticateAgent('Bearer oauth').pipe(
        Effect.map((agent) => {
          expect(agent).toEqual({
            account: expect.objectContaining({ id: 'user_chris', email: 'chris@example.com' }),
            clientId: 'https://claude.ai/oauth/mcp-oauth-client-metadata',
            scopes: ['profile', 'email'],
          });
          expect(clerk.authenticateRequest).toHaveBeenCalledWith(expect.any(Request), {
            acceptsToken: 'oauth_token',
            audience: resource,
          });
        }),
      ),
    );
    it.effect('rejects missing credentials without calling Clerk', () =>
      authenticateAgent(undefined).pipe(
        Effect.flip,
        Effect.map((error) => {
          expect(error._tag).toBe('SignInRequired');
          expect(clerk.authenticateRequest).not.toHaveBeenCalled();
        }),
      ),
    );
    it.effect('rejects unauthenticated, wrong-audience or non-OAuth tokens', () => {
      clerk.authenticateRequest.mockResolvedValueOnce({
        toAuth: () => ({ tokenType: 'oauth_token', isAuthenticated: false, userId: null, clientId: null }),
      });
      return authenticateAgent('Bearer expired').pipe(
        Effect.flip,
        Effect.map((error) => {
          expect(error._tag).toBe('SignInRequired');
          expect(clerk.users.getUser).not.toHaveBeenCalled();
        }),
      );
    });
    it.effect('treats verification failures as sign-in required', () => {
      clerk.authenticateRequest.mockRejectedValueOnce(new Error('aud mismatch'));
      return authenticateAgent('Bearer other-audience').pipe(
        Effect.flip,
        Effect.map((error) => expect(error._tag).toBe('SignInRequired')),
      );
    });
    it.effect('reports missing Clerk configuration', () =>
      authenticateAgent('Bearer oauth', false).pipe(
        Effect.flip,
        Effect.map((error) => expect(error._tag).toBe('IdentityUnavailable')),
      ),
    );
  });

  it('derives the Clerk Frontend API from a publishable key', () => {
    const key = `pk_live_${Buffer.from('clerk.appspeed.dev$').toString('base64')}`;
    expect(clerkFrontendApiUrl(key)).toEqual(Option.some('https://clerk.appspeed.dev'));
    expect(clerkFrontendApiUrl('test_publishable_key')).toEqual(Option.none());
    expect(clerkFrontendApiUrl('pk_live_not base64!')).toEqual(Option.none());
    expect(clerkFrontendApiUrl('')).toEqual(Option.none());
  });
});
