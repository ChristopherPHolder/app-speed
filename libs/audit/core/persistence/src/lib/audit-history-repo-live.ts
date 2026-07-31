import { and, desc, eq, inArray, lt, or } from 'drizzle-orm';
import { Effect, Layer } from 'effect';

import type { AuditKind } from '@app-speed/audit/core/domain';

import { AuditHistoryRepo } from './audit-history-repo';
import { AuditRepo } from './audit-repo';
import {
  decodeAuditRunSummaryRecord,
  type AuditRunId,
  type AuditRunListCursor,
  type AuditStatus,
} from './audit-record';
import { DbClient } from './db';
import { auditResultTable, auditRunTable, auditTemplateTable } from './schema';

const listRunsPage = Effect.fn('db.auditHistory.listPage')(function* (params: {
  limit: number;
  cursor: AuditRunListCursor | null;
  status: ReadonlyArray<AuditStatus> | null;
  kind: AuditKind | null;
}) {
  const db = yield* DbClient;
  const auditRepo = yield* AuditRepo;
  const limit = Math.max(1, Math.min(params.limit, 100));
  const filters = [
    params.status && params.status.length > 0 ? inArray(auditRunTable.status, params.status) : undefined,
    params.kind ? eq(auditTemplateTable.kind, params.kind) : undefined,
    params.cursor
      ? or(
          lt(auditRunTable.createdAt, new Date(params.cursor.createdAtMs)),
          and(eq(auditRunTable.createdAt, new Date(params.cursor.createdAtMs)), lt(auditRunTable.id, params.cursor.id)),
        )
      : undefined,
  ].filter((filter) => filter !== undefined);
  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const rows = yield* db.run((client) => {
    const query = client
      .select({
        id: auditRunTable.id,
        kind: auditTemplateTable.kind,
        title: auditTemplateTable.title,
        status: auditRunTable.status,
        resultStatus: auditResultTable.status,
        createdAt: auditRunTable.createdAt,
        startedAt: auditRunTable.startedAt,
        completedAt: auditRunTable.completedAt,
        durationMs: auditRunTable.durationMs,
      })
      .from(auditRunTable)
      .innerJoin(auditTemplateTable, eq(auditTemplateTable.id, auditRunTable.templateId))
      .leftJoin(auditResultTable, eq(auditResultTable.runId, auditRunTable.id))
      .orderBy(desc(auditRunTable.createdAt), desc(auditRunTable.id))
      .limit(limit + 1);

    return whereClause ? query.where(whereClause) : query;
  });

  const pageRows = rows.slice(0, limit);
  const items = yield* Effect.forEach(pageRows, (row) =>
    Effect.gen(function* () {
      const queuePosition = row.status === 'SCHEDULED' ? yield* auditRepo.getQueuePosition(row.id as AuditRunId) : null;
      return yield* decodeAuditRunSummaryRecord({
        ...row,
        resultStatus: row.resultStatus ?? null,
        queuePosition: row.status === 'SCHEDULED' ? (queuePosition ?? 0) : null,
      });
    }),
  );

  const hasMore = rows.length > limit;
  const last = pageRows.at(-1);
  return {
    items,
    nextCursor: hasMore && last ? { createdAtMs: last.createdAt.getTime(), id: last.id } : null,
  };
});

export const AuditHistoryRepoLive = Layer.effect(
  AuditHistoryRepo,
  Effect.gen(function* () {
    const db = yield* DbClient;
    const auditRepo = yield* AuditRepo;
    return {
      listRunsPage: (params: {
        limit: number;
        cursor: AuditRunListCursor | null;
        status: ReadonlyArray<AuditStatus> | null;
        kind: AuditKind | null;
      }) => listRunsPage(params).pipe(Effect.provideService(DbClient, db), Effect.provideService(AuditRepo, auditRepo)),
    };
  }),
);
