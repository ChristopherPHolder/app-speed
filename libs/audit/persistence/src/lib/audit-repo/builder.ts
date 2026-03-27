import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { Clock, Effect } from 'effect';

import { ReplayUserflowAudit } from '@app-speed/audit/contracts';

import { DbClient } from '../db';
import { auditTemplateTable, auditRunTable } from '../schema';
import {
  type AuditTemplateId,
  type AuditRunId,
  decodeAuditTemplateRecord,
} from './shared';

export const createTemplate = Effect.fn('db.auditTemplate.create')(function* (audit: ReplayUserflowAudit) {
  const db = yield* DbClient;
  const now = new Date(yield* Clock.currentTimeMillis);
  const id = randomUUID() as AuditTemplateId;

  yield* Effect.annotateCurrentSpan({
    'audit.title': audit.title,
    'audit.device': audit.device,
  });

  yield* db.run((client) =>
    client
      .insert(auditTemplateTable)
      .values({
        id,
        data: audit,
        createdAt: now,
        updatedAt: now,
      })
      .run(),
  );

  yield* Effect.annotateCurrentSpan({ 'audit.template_id': id });
  return id;
});

export const getTemplateById = Effect.fn('db.auditTemplate.getById')(function* (id: AuditTemplateId) {
  const db = yield* DbClient;
  yield* Effect.annotateCurrentSpan({ 'audit.template_id': id });
  const record = yield* db.run((client) =>
    client.select().from(auditTemplateTable).where(eq(auditTemplateTable.id, id)).get(),
  );

  if (!record) {
    return null;
  }

  return yield* decodeAuditTemplateRecord({
    id: record.id,
    data: record.data,
    createAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
});

export const createRun = Effect.fn('db.auditRun.create')(function* (templateId: AuditTemplateId) {
  const db = yield* DbClient;
  const now = new Date(yield* Clock.currentTimeMillis);
  const id = randomUUID() as AuditRunId;

  yield* Effect.annotateCurrentSpan({ 'audit.template_id': templateId });

  yield* db.run((client) =>
    client
      .insert(auditRunTable)
      .values({
        id,
        templateId,
        status: 'SCHEDULED',
        createdAt: now,
        updatedAt: now,
      })
      .run(),
  );

  yield* Effect.annotateCurrentSpan({ 'audit.id': id });
  return id;
});
