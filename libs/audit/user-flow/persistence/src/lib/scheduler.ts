import { randomUUID } from 'node:crypto';
import { Clock, Context, Effect, Layer } from 'effect';

import {
  auditRunTable,
  auditTemplateTable,
  DbClient,
  type AuditRunId,
  type AuditTemplateId,
  QueryError,
} from '@app-speed/audit/core/persistence';
import { USER_FLOW_AUDIT_KIND, type UserFlowAuditDefinition } from '@app-speed/audit/user-flow/domain';

import { userFlowAuditTemplateTable } from './schema';

export class UserFlowAuditScheduler extends Context.Tag('UserFlowAuditScheduler')<
  UserFlowAuditScheduler,
  {
    schedule: (definition: UserFlowAuditDefinition) => Effect.Effect<AuditRunId, QueryError>;
  }
>() {}

const schedule = Effect.fn('db.userFlowAudit.schedule')(function* (definition: UserFlowAuditDefinition) {
  const db = yield* DbClient;
  const now = new Date(yield* Clock.currentTimeMillis);
  const templateId = randomUUID() as AuditTemplateId;
  const runId = randomUUID() as AuditRunId;

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
        createdAt: now,
        updatedAt: now,
      });
      await tx.insert(userFlowAuditTemplateTable).values({
        templateId,
        definition,
      });
      await tx.insert(auditRunTable).values({
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

export const UserFlowAuditSchedulerLive = Layer.effect(
  UserFlowAuditScheduler,
  Effect.gen(function* () {
    const db = yield* DbClient;
    return {
      schedule: (definition) => schedule(definition).pipe(Effect.provideService(DbClient, db)),
    };
  }),
);
