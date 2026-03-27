import { and, desc, eq, inArray, lt, or } from 'drizzle-orm';
import { Effect } from 'effect';

import { DbClient } from '../db';
import { auditResultTable, auditRunTable, auditTemplateTable } from '../schema';
import {
  type AuditRunId,
  type AuditRunListCursor,
  type AuditStatus,
  decodeAuditRunSummaryRecord,
  resolveAuditTitle,
} from './shared';
import { getQueuePosition } from './queue';

export const getRunSummaryById = Effect.fn('db.auditRun.getSummaryById')(function* (id: AuditRunId) {
  const db = yield* DbClient;
  yield* Effect.annotateCurrentSpan({ 'audit.id': id });

  const row = yield* db.run((client) =>
    client
      .select({
        id: auditRunTable.id,
        status: auditRunTable.status,
        createdAt: auditRunTable.createdAt,
        startedAt: auditRunTable.startedAt,
        completedAt: auditRunTable.completedAt,
        durationMs: auditRunTable.durationMs,
        templateData: auditTemplateTable.data,
        resultStatus: auditResultTable.status,
      })
      .from(auditRunTable)
      .innerJoin(auditTemplateTable, eq(auditTemplateTable.id, auditRunTable.templateId))
      .leftJoin(auditResultTable, eq(auditResultTable.runId, auditRunTable.id))
      .where(eq(auditRunTable.id, id))
      .get(),
  );

  if (!row) {
    return null;
  }

  const queuePosition = row.status === 'SCHEDULED' ? yield* getQueuePosition(row.id as AuditRunId) : null;

  return yield* decodeAuditRunSummaryRecord({
    id: row.id,
    title: resolveAuditTitle(row.templateData),
    status: row.status,
    resultStatus: row.resultStatus ?? null,
    queuePosition: row.status === 'SCHEDULED' ? (queuePosition ?? 0) : null,
    createdAt: row.createdAt,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    durationMs: row.durationMs,
  });
});

export const listRunsPage = Effect.fn('db.auditRun.listPage')(function* (params: {
  limit: number;
  cursor: AuditRunListCursor | null;
  status: ReadonlyArray<AuditStatus> | null;
}) {
  const db = yield* DbClient;
  const limit = Math.max(1, Math.min(params.limit, 100));
  const statusFilter = params.status && params.status.length > 0 ? inArray(auditRunTable.status, params.status) : null;
  const cursorFilter = params.cursor
    ? or(
        lt(auditRunTable.createdAt, new Date(params.cursor.createdAtMs)),
        and(eq(auditRunTable.createdAt, new Date(params.cursor.createdAtMs)), lt(auditRunTable.id, params.cursor.id)),
      )
    : null;
  const whereClause = statusFilter && cursorFilter ? and(statusFilter, cursorFilter) : (statusFilter ?? cursorFilter);

  const rows = yield* db.run((client) => {
    const baseQuery = client
      .select({
        id: auditRunTable.id,
        status: auditRunTable.status,
        createdAt: auditRunTable.createdAt,
        startedAt: auditRunTable.startedAt,
        completedAt: auditRunTable.completedAt,
        durationMs: auditRunTable.durationMs,
        templateData: auditTemplateTable.data,
        resultStatus: auditResultTable.status,
      })
      .from(auditRunTable)
      .innerJoin(auditTemplateTable, eq(auditTemplateTable.id, auditRunTable.templateId))
      .leftJoin(auditResultTable, eq(auditResultTable.runId, auditRunTable.id))
      .orderBy(desc(auditRunTable.createdAt), desc(auditRunTable.id))
      .limit(limit + 1);

    return whereClause ? baseQuery.where(whereClause).all() : baseQuery.all();
  });

  const pageRows = rows.slice(0, limit);
  const items = yield* Effect.forEach(pageRows, (row) =>
    Effect.gen(function* () {
      const queuePosition = row.status === 'SCHEDULED' ? yield* getQueuePosition(row.id as AuditRunId) : null;

      return yield* decodeAuditRunSummaryRecord({
        id: row.id,
        title: resolveAuditTitle(row.templateData),
        status: row.status,
        resultStatus: row.resultStatus ?? null,
        queuePosition: row.status === 'SCHEDULED' ? (queuePosition ?? 0) : null,
        createdAt: row.createdAt,
        startedAt: row.startedAt,
        completedAt: row.completedAt,
        durationMs: row.durationMs,
      });
    }),
  );

  const hasMore = rows.length > limit;
  const nextCursor =
    hasMore && pageRows.length > 0
      ? {
          createdAtMs: pageRows[pageRows.length - 1].createdAt.getTime(),
          id: pageRows[pageRows.length - 1].id,
        }
      : null;

  return {
    items,
    nextCursor,
  };
});
