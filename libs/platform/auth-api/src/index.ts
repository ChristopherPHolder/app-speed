import { HttpRouter, HttpServerResponse } from 'effect/http';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { Config, Context, Effect, Layer, Option, Redacted, Schema } from 'effect';

export class IdentityError extends Schema.TaggedError<IdentityError>()('IdentityError', {
  message: Schema.String,
}) {}
export type Identity = { userId: string; sessionId: string };
export type SpaceAccess = { id: string; kind: 'personal' | 'organization'; role: 'admin' | 'member'; userId: string };

export class ClerkIdentity extends Context.Service<
  ClerkIdentity,
  {
    identify: (headers: Readonly<Record<string, string | undefined>>) => Effect.Effect<Identity | null, IdentityError>;
    authorize: (userId: string, spaceId: string) => Effect.Effect<SpaceAccess, IdentityError>;
    exists: (spaceId: string) => Effect.Effect<boolean, IdentityError>;
    readonly publishableKey: string;
  }
>()('ClerkIdentity') {
  static readonly live = Layer.effect(ClerkIdentity)(
    Effect.gen(function* () {
      const key = yield* Config.Redacted('CLERK_SECRET_KEY').pipe(Config.option);
      const publishableKey = yield* Config.String('CLERK_PUBLISHABLE_KEY').pipe(Config.withDefault(''));
      const parties = yield* Config.String('CLERK_AUTHORIZED_PARTIES').pipe(
        Config.withDefault('http://localhost:4200'),
      );
      const secretKey = Option.isSome(key) ? Redacted.value(key.value) : '';
      const client = createClerkClient({ secretKey, publishableKey });
      const call = <A>(f: () => Promise<A>) =>
        Effect.tryPromise({
          try: f,
          catch: () => new IdentityError({ message: 'Identity could not be verified.' }),
        });
      const exists = (spaceId: string) =>
        call(async () => {
          try {
            if (spaceId.startsWith('personal:')) await client.users.getUser(spaceId.slice(9));
            else if (spaceId.startsWith('org:'))
              await client.organizations.getOrganization({ organizationId: spaceId.slice(4) });
            else return false;
            return true;
          } catch (error) {
            if (typeof error === 'object' && error !== null && 'status' in error && error.status === 404) return false;
            throw error;
          }
        });
      return {
        publishableKey,
        identify: (headers) => {
          const bearer = headers['authorization'];
          const cookie = headers['cookie']
            ?.split(';')
            .map((part) => part.trim())
            .find((part) => part.startsWith('__session='))
            ?.slice(10);
          const token = bearer?.startsWith('Bearer ') ? bearer.slice(7) : cookie;
          if (!token) return Effect.succeed(null);
          if (!secretKey) return Effect.fail(new IdentityError({ message: 'Authentication is not configured.' }));
          return call(async () => {
            const claims = await verifyToken(token, {
              secretKey,
              authorizedParties: parties.split(',').map((s) => s.trim()),
            });
            const session = await client.sessions.getSession(claims.sid);
            if (session.status !== 'active' || session.userId !== claims.sub) throw new Error('Inactive session');
            await client.users.getUser(claims.sub);
            return { userId: claims.sub, sessionId: claims.sid };
          });
        },
        authorize: (userId, spaceId) =>
          call(async () => {
            if (spaceId === `personal:${userId}`) {
              await client.users.getUser(userId);
              return { id: spaceId, kind: 'personal', role: 'admin', userId };
            }
            if (!spaceId.startsWith('org:')) throw new Error('Invalid space');
            const organizationId = spaceId.slice(4);
            const memberships = await client.organizations.getOrganizationMembershipList({
              organizationId,
              userId: [userId],
              limit: 1,
            });
            const membership = memberships.data[0];
            if (!membership || !['org:admin', 'org:member'].includes(membership.role)) throw new Error('Not a member');
            return {
              id: spaceId,
              kind: 'organization',
              role: membership.role === 'org:admin' ? 'admin' : 'member',
              userId,
            };
          }),
        exists,
      };
    }),
  );
}

export const ClerkConfigRoutes = HttpRouter.add(
  'GET',
  '/api/auth/config',
  Effect.gen(function* () {
    const identity = yield* ClerkIdentity;
    return HttpServerResponse.jsonUnsafe(
      { publishableKey: identity.publishableKey },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }),
);
