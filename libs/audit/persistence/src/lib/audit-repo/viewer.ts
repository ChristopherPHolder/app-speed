import { eq } from 'drizzle-orm';
import { Effect } from 'effect';

import { DbClient } from '../db';
import { auditResultTable, auditRunTable, auditTemplateTable } from '../schema';
import { type AuditRunId, decodeAuditResultRecord, decodeAuditRunRecord } from './shared';

export const getRunById = Effect.fn('db.auditRun.getById')(function* (id: AuditRunId) {
  const db = yield* DbClient;
  yield* Effect.annotateCurrentSpan({ 'audit.id': id });

  const record = yield* db.run((client) =>
    client
      .select({
        id: auditRunTable.id,
        templateId: auditRunTable.templateId,
        status: auditRunTable.status,
        createdAt: auditRunTable.createdAt,
        updatedAt: auditRunTable.updatedAt,
        startedAt: auditRunTable.startedAt,
        completedAt: auditRunTable.completedAt,
        durationMs: auditRunTable.durationMs,
        templateData: auditTemplateTable.data,
      })
      .from(auditRunTable)
      .innerJoin(auditTemplateTable, eq(auditTemplateTable.id, auditRunTable.templateId))
      .where(eq(auditRunTable.id, id))
      .get(),
  );

  if (!record) {
    return null;
  }

  const decoded = yield* decodeAuditRunRecord(record);
  yield* Effect.annotateCurrentSpan({ 'audit.status': decoded.status });
  return decoded;
});

export const getResultByRunId = Effect.fn('db.auditResult.getByRunId')(function* (id: AuditRunId) {
  const db = yield* DbClient;
  yield* Effect.annotateCurrentSpan({ 'audit.id': id });

  const record = yield* db.run((client) =>
    client
      .select({
        runId: auditResultTable.runId,
        status: auditResultTable.status,
        data: auditResultTable.data,
        error: auditResultTable.error,
        reportHtml: auditResultTable.reportHtml,
        createdAt: auditResultTable.createdAt,
      })
      .from(auditResultTable)
      .where(eq(auditResultTable.runId, id))
      .get(),
  );

  if (!record) {
    return null;
  }

  const decoded = yield* decodeAuditResultRecord(record);
  yield* Effect.annotateCurrentSpan({ 'audit.result_status': decoded.status });
  return decoded;
});
