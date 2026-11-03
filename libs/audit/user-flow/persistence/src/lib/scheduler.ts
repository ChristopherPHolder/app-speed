import { randomUUID } from 'node:crypto';
import { Clock, Context, Effect, Layer, Schema } from 'effect';

import {
  auditRunTable,
  auditVersionTable,
  auditTemplateTable,
  DbClient,
  type AuditRunId,
  AuditTemplateIdSchema,
  AuditRunIdSchema,
  QueryError,
} from '@app-speed/audit/core/persistence';
import { USER_FLOW_AUDIT_KIND, type UserFlowAuditDefinition } from '@app-speed/audit/user-flow/domain';

import { userFlowAuditTemplateTable } from './schema';

export class UserFlowAuditScheduler extends Context.Service<
  UserFlowAuditScheduler,
  {
    schedule: (
      definition: UserFlowAuditDefinition,
      ownership?: {
        spaceId: string | null;
        createdBy: string | null;
        guestBrowserHash: string | null;
        claimHash: string | null;
      },
    ) => Effect.Effect<AuditRunId, QueryError>;
  }
>()('UserFlowAuditScheduler') {}

const schedule = Effect.fn('db.userFlowAudit.schedule')(function* (
  definition: UserFlowAuditDefinition,
  ownership?: {
    spaceId: string | null;
    createdBy: string | null;
    guestBrowserHash: string | null;
    claimHash: string | null;
  },
) {
  const db = yield* DbClient;
  const now = new Date(yield* Clock.currentTimeMillis);
  const templateId = yield* Schema.decodeUnknownEffect(AuditTemplateIdSchema)(randomUUID()).pipe(
    Effect.mapError((cause) => new QueryError({ message: 'Invalid template ID.', cause })),
  );
  const versionId = randomUUID();
  const runId = yield* Schema.decodeUnknownEffect(AuditRunIdSchema)(randomUUID()).pipe(
    Effect.mapError((cause) => new QueryError({ message: 'Invalid run ID.', cause })),
  );

  yield* Effect.annotateCurrentSpan({
    'audit.kind': USER_FLOW_AUDIT_KIND,
    'audit.title': definition.title,
    'audit.device': definition.device,
    'audit.template_id': templateId,
    'audit.id': runId,
  });

  yield* db.run((client) =>
    client.transaction(async (tx) => {
      await tx.insert(auditTemplateTable).values({
        id: templateId,
        kind: USER_FLOW_AUDIT_KIND,
        title: definition.title,
        ...ownership,
        createdAt: now,
        updatedAt: now,
      });
      await tx.insert(userFlowAuditTemplateTable).values({
        templateId,
        definition,
      });
      await tx.insert(auditVersionTable).values({ id: versionId, templateId, definition, createdAt: now });
      await tx.insert(auditRunTable).values({
        versionId,
        id: runId,
        templateId,
        status: 'SCHEDULED',
        createdAt: now,
        updatedAt: now,
      });
    }),
  );

  return runId;
});

export const UserFlowAuditSchedulerLive = Layer.effect(UserFlowAuditScheduler)(
  Effect.gen(function* () {
    const db = yield* DbClient;
    return {
      schedule: (definition, ownership) => schedule(definition, ownership).pipe(Effect.provideService(DbClient, db)),
    };
  }),
);
