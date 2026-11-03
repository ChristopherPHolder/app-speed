import { beforeEach, expect, vi } from 'vitest';
import { layer } from '@effect/vitest';
import { ConfigProvider, Effect, Layer } from 'effect';
import { ClerkIdentity } from './index';
const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  session: vi.fn(),
  user: vi.fn(),
  organization: vi.fn(),
  memberships: vi.fn(),
}));
vi.mock('@clerk/backend', () => ({
  verifyToken: mocks.verify,
  createClerkClient: () => ({
    sessions: { getSession: mocks.session },
    users: { getUser: mocks.user },
    organizations: { getOrganization: mocks.organization, getOrganizationMembershipList: mocks.memberships },
  }),
}));
beforeEach(() => {
  vi.resetAllMocks();
  mocks.verify.mockResolvedValue({ sub: 'alice', sid: 'session-1' });
  mocks.session.mockResolvedValue({ status: 'active', userId: 'alice' });
  mocks.user.mockResolvedValue({ id: 'alice' });
  mocks.organization.mockResolvedValue({ id: 'team' });
  mocks.memberships.mockResolvedValue({ data: [{ role: 'org:member' }] });
});
const Config = Layer.succeed(ConfigProvider.ConfigProvider)(
  ConfigProvider.fromUnknown({
    CLERK_SECRET_KEY: 'test-secret',
    CLERK_PUBLISHABLE_KEY: 'test-public',
    CLERK_AUTHORIZED_PARTIES: 'https://portal.test',
  }),
);
layer(ClerkIdentity.live.pipe(Layer.provide(Config)))('Clerk identity boundary', (test) => {
  test.effect('keeps requests without a token anonymous', () =>
    Effect.gen(function* () {
      const service = yield* ClerkIdentity;
      expect(yield* service.identify({})).toBeNull();
      expect(mocks.verify).not.toHaveBeenCalled();
    }),
  );
  test.effect('verifies signature and authorized party, then checks live session and user', () =>
    Effect.gen(function* () {
      const service = yield* ClerkIdentity;
      expect(yield* service.identify({ authorization: 'Bearer signed-token' })).toEqual({
        userId: 'alice',
        sessionId: 'session-1',
      });
      expect(mocks.verify).toHaveBeenCalledWith('signed-token', {
        secretKey: 'test-secret',
        authorizedParties: ['https://portal.test'],
      });
      expect(mocks.session).toHaveBeenCalledWith('session-1');
      expect(mocks.user).toHaveBeenCalledWith('alice');
    }),
  );
  test.effect('accepts the same-origin Clerk session cookie for SSE', () =>
    Effect.gen(function* () {
      const service = yield* ClerkIdentity;
      yield* service.identify({ cookie: 'other=value; __session=signed-cookie; last=value' });
      expect(mocks.verify).toHaveBeenCalledWith('signed-cookie', expect.anything());
    }),
  );
  test.effect('rejects invalid signatures and sessions revoked since token issuance', () =>
    Effect.gen(function* () {
      const service = yield* ClerkIdentity;
      mocks.verify.mockRejectedValueOnce(new Error('bad signature'));
      expect((yield* service.identify({ authorization: 'Bearer forged' }).pipe(Effect.exit))._tag).toBe('Failure');
      mocks.session.mockResolvedValueOnce({ status: 'ended', userId: 'alice' });
      expect((yield* service.identify({ authorization: 'Bearer old-token' }).pipe(Effect.exit))._tag).toBe('Failure');
    }),
  );
  test.effect('checks current membership and rejects stale organization selections', () =>
    Effect.gen(function* () {
      const service = yield* ClerkIdentity;
      expect((yield* service.authorize('alice', 'org:team')).role).toBe('member');
      mocks.memberships.mockResolvedValueOnce({ data: [] });
      expect((yield* service.authorize('alice', 'org:team').pipe(Effect.exit))._tag).toBe('Failure');
      expect((yield* service.authorize('alice', 'personal:bob').pipe(Effect.exit))._tag).toBe('Failure');
    }),
  );
  test.effect('distinguishes deleted spaces from identity-provider outages', () =>
    Effect.gen(function* () {
      const service = yield* ClerkIdentity;
      mocks.organization.mockRejectedValueOnce({ status: 404 });
      expect(yield* service.exists('org:deleted')).toBe(false);
      mocks.organization.mockRejectedValueOnce({ status: 503 });
      expect((yield* service.exists('org:unavailable').pipe(Effect.exit))._tag).toBe('Failure');
    }),
  );
});
