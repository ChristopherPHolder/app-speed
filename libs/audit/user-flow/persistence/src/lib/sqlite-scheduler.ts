import { randomUUID } from 'node:crypto';
import { Clock, Effect, Layer } from 'effect';

import {
  sqliteAuditRunTable as auditRunTable,
  sqliteAuditTemplateTable as auditTemplateTable,
  SqliteDbClient,
  type AuditOrigin,
  type AuditRunId,
  type AuditTemplateId,
} from '@app-speed/audit/core/persistence';
import { USER_FLOW_AUDIT_KIND, type UserFlowAuditDefinition } from '@app-speed/audit/user-flow/domain';

import { userFlowAuditTemplateTable } from './sqlite-schema';

import { UserFlowAuditScheduler } from './scheduler';

const schedule = Effect.fn('db.userFlowAudit.schedule')(function* (
  definition: UserFlowAuditDefinition,
  projectId: string | null = null,
  origin: AuditOrigin = { source: 'portal' },
) {
  const db = yield* SqliteDbClient;
  const now = new Date(yield* Clock.currentTimeMillis);
  const templateId = randomUUID() as AuditTemplateId;
  const runId = randomUUID() as AuditRunId;

  yield* Effect.annotateCurrentSpan({
    'audit.kind': USER_FLOW_AUDIT_KIND,
    'audit.title': definition.title,
    'audit.device': definition.device,
    'audit.template_id': templateId,
    'audit.id': runId,
    'audit.source': origin.source,
    ...(origin.source === 'mcp' ? { 'audit.client_id': origin.clientId } : {}),
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
        projectId,
        source: origin.source,
        clientId: origin.source === 'mcp' ? origin.clientId : null,
        clientName: origin.source === 'mcp' ? origin.clientName : null,
        createdAt: now,
        updatedAt: now,
      });
    }),
  );

  return runId;
});

export const SqliteUserFlowAuditSchedulerLive = Layer.effect(UserFlowAuditScheduler)(
  Effect.gen(function* () {
    const db = yield* SqliteDbClient;
    return {
      schedule: (definition, projectId, origin) =>
        schedule(definition, projectId, origin).pipe(Effect.provideService(SqliteDbClient, db)),
    };
  }),
);
