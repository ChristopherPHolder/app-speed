import { createHash, randomBytes } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { HttpServerRequest } from 'effect/http';
import { HttpApiError } from 'effect/http-api';
import { ClerkIdentity } from '@app-speed/platform/auth-api';
import {
  auditRunTable,
  auditShareTable,
  auditSpaceTable,
  auditTemplateTable,
  DbClient,
} from '@app-speed/audit/core/persistence';

export const hashCredential = (value: string) => createHash('sha256').update(value).digest('hex');
export const newCredential = () => randomBytes(32).toString('base64url');

export class AuditAccess extends Context.Service<
  AuditAccess,
  {
    current: Effect.Effect<
      {
        identity: { userId: string; sessionId: string } | null;
        browserHash: string | null;
        spaceId: string | null;
      },
      HttpApiError.Unauthorized,
      HttpServerRequest.HttpServerRequest
    >;
    space: Effect.Effect<
      import('@app-speed/platform/auth-api').SpaceAccess,
      HttpApiError.Forbidden | HttpApiError.Unauthorized | HttpApiError.BadRequest,
      HttpServerRequest.HttpServerRequest
    >;
    run: (
      id: string,
      allowShare?: boolean,
    ) => Effect.Effect<void, HttpApiError.NotFound | HttpApiError.BadRequest, HttpServerRequest.HttpServerRequest>;
  }
>()('AuditAccess') {
  static readonly live = Layer.effect(AuditAccess)(
    Effect.gen(function* () {
      const clerk = yield* ClerkIdentity;
      const db = yield* DbClient;
      const current = Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;
        const identity = yield* clerk
          .identify(request.headers)
          .pipe(Effect.mapError(() => new HttpApiError.Unauthorized()));
        const browser = request.headers['x-guest-browser'];
        return {
          identity,
          browserHash: browser && /^[A-Za-z0-9_-]{40,100}$/.test(browser) ? hashCredential(browser) : null,
          spaceId: identity ? (request.headers['x-audit-space'] ?? `personal:${identity.userId}`) : null,
        };
      });
      const space = Effect.gen(function* () {
        const actor = yield* current;
        if (!actor.identity || !actor.spaceId) return yield* new HttpApiError.Unauthorized();
        const access = yield* clerk
          .authorize(actor.identity.userId, actor.spaceId)
          .pipe(Effect.mapError(() => new HttpApiError.Forbidden()));
        const alive = yield* db
          .run(async (client) => {
            await client.insert(auditSpaceTable).values({ id: access.id }).onConflictDoNothing();
            return (await client.select().from(auditSpaceTable).where(eq(auditSpaceTable.id, access.id)))[0];
          })
          .pipe(Effect.mapError(() => new HttpApiError.BadRequest()));
        if (!alive || alive.deletedAt) return yield* new HttpApiError.Forbidden();
        return access;
      });
      const run = Effect.fn('audit.authorizeRun')(
        function* (id: string, allowShare = false) {
          const request = yield* HttpServerRequest.HttpServerRequest;
          const row = yield* db.run(
            async (client) =>
              (
                await client
                  .select({ spaceId: auditTemplateTable.spaceId })
                  .from(auditRunTable)
                  .innerJoin(auditTemplateTable, eq(auditTemplateTable.id, auditRunTable.templateId))
                  .where(eq(auditRunTable.id, id))
                  .limit(1)
              )[0],
          );
          if (!row) return yield* new HttpApiError.NotFound();
          if (!row.spaceId) return;
          const alive = yield* clerk.exists(row.spaceId);
          if (!alive) return yield* new HttpApiError.NotFound();
          const spaceRow = yield* db.run(
            async (client) =>
              (
                await client
                  .select()
                  .from(auditSpaceTable)
                  .where(eq(auditSpaceTable.id, row.spaceId ?? ''))
              )[0],
          );
          if (!spaceRow || spaceRow.deletedAt) return yield* new HttpApiError.NotFound();
          if (allowShare) {
            const token =
              new URL(request.url, 'http://api').searchParams.get('share') ?? request.headers['x-audit-share'];
            if (token) {
              const share = yield* db.run(
                async (client) =>
                  (
                    await client
                      .select({ id: auditShareTable.id })
                      .from(auditShareTable)
                      .where(
                        and(
                          eq(auditShareTable.runId, id),
                          eq(auditShareTable.tokenHash, hashCredential(token)),
                          isNull(auditShareTable.revokedAt),
                        ),
                      )
                      .limit(1)
                  )[0],
              );
              if (share) return;
            }
          }
          const actor = yield* current;
          if (!actor.identity) return yield* new HttpApiError.NotFound();
          yield* clerk
            .authorize(actor.identity.userId, row.spaceId)
            .pipe(Effect.mapError(() => new HttpApiError.NotFound()));
        },
        Effect.catchTags({
          QueryError: () => new HttpApiError.BadRequest(),
          IdentityError: () => new HttpApiError.NotFound(),
          Unauthorized: () => new HttpApiError.NotFound(),
        }),
      );
      return { current, space, run };
    }),
  );
}
