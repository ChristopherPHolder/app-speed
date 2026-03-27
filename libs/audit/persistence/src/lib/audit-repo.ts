import { Context, Effect, Layer, ParseResult } from 'effect';

import { ReplayUserflowAudit } from '@app-speed/audit/contracts';

import { DbClient, QueryError } from './db';
import { createRun, createTemplate, getTemplateById } from './audit-repo/builder';
import { claimNextRun, completeRun, getQueuePosition, hasScheduledRuns, markRunInProgress } from './audit-repo/queue';
import { getRunSummaryById, listRunsPage } from './audit-repo/runs';
import {
  type AuditRunId,
  type AuditRunListCursor,
  type AuditRunRecord,
  type AuditRunSummaryRecord,
  type AuditStatus,
  type AuditTemplateId,
  type AuditTemplateRecord,
  type AuditResultRecord,
} from './audit-repo/shared';
import { getResultByRunId, getRunById } from './audit-repo/viewer';

export class AuditRepo extends Context.Tag('AuditRepo')<
  AuditRepo,
  {
    createTemplate: (audit: ReplayUserflowAudit) => Effect.Effect<AuditTemplateId, QueryError>;
    getTemplateById: (
      id: AuditTemplateId,
    ) => Effect.Effect<AuditTemplateRecord | null, QueryError | ParseResult.ParseError>;
    createRun: (templateId: AuditTemplateId) => Effect.Effect<AuditRunId, QueryError>;
    claimNextRun: () => Effect.Effect<AuditRunRecord | null, QueryError | ParseResult.ParseError>;
    hasScheduledRuns: () => Effect.Effect<boolean, QueryError>;
    markRunInProgress: (id: AuditRunId) => Effect.Effect<void, QueryError>;
    getQueuePosition: (id: AuditRunId) => Effect.Effect<number | null, QueryError | ParseResult.ParseError>;
    getRunSummaryById: (
      id: AuditRunId,
    ) => Effect.Effect<AuditRunSummaryRecord | null, QueryError | ParseResult.ParseError>;
    listRunsPage: (params: {
      limit: number;
      cursor: AuditRunListCursor | null;
      status: ReadonlyArray<AuditStatus> | null;
    }) => Effect.Effect<
      {
        items: ReadonlyArray<AuditRunSummaryRecord>;
        nextCursor: AuditRunListCursor | null;
      },
      QueryError | ParseResult.ParseError
    >;
    completeRun: (
      id: AuditRunId,
      result: { status: 'SUCCESS' | 'FAILURE'; data: unknown; error?: unknown; reportHtml?: string | null },
      durationMs: number,
    ) => Effect.Effect<void, QueryError>;
    getRunById: (id: AuditRunId) => Effect.Effect<AuditRunRecord | null, QueryError | ParseResult.ParseError>;
    getResultByRunId: (id: AuditRunId) => Effect.Effect<AuditResultRecord | null, QueryError | ParseResult.ParseError>;
  }
>() {}

export { AuditRunIdSchema } from './audit-repo/shared';
export type { AuditRunId } from './audit-repo/shared';

export const AuditRepoLive = Layer.effect(
  AuditRepo,
  Effect.gen(function* () {
    const db = yield* DbClient;

    return {
      createTemplate: (audit: ReplayUserflowAudit) => createTemplate(audit).pipe(Effect.provideService(DbClient, db)),
      getTemplateById: (id: AuditTemplateId) => getTemplateById(id).pipe(Effect.provideService(DbClient, db)),
      createRun: (templateId: AuditTemplateId) => createRun(templateId).pipe(Effect.provideService(DbClient, db)),
      claimNextRun: () => claimNextRun().pipe(Effect.provideService(DbClient, db)),
      hasScheduledRuns: () => hasScheduledRuns().pipe(Effect.provideService(DbClient, db)),
      markRunInProgress: (id: AuditRunId) => markRunInProgress(id).pipe(Effect.provideService(DbClient, db)),
      getQueuePosition: (id: AuditRunId) => getQueuePosition(id).pipe(Effect.provideService(DbClient, db)),
      getRunSummaryById: (id: AuditRunId) => getRunSummaryById(id).pipe(Effect.provideService(DbClient, db)),
      listRunsPage: (params: {
        limit: number;
        cursor: AuditRunListCursor | null;
        status: ReadonlyArray<AuditStatus> | null;
      }) => listRunsPage(params).pipe(Effect.provideService(DbClient, db)),
      completeRun: (
        id: AuditRunId,
        result: { status: 'SUCCESS' | 'FAILURE'; data: unknown; error?: unknown; reportHtml?: string | null },
        durationMs: number,
      ) => completeRun(id, result, durationMs).pipe(Effect.provideService(DbClient, db)),
      getRunById: (id: AuditRunId) => getRunById(id).pipe(Effect.provideService(DbClient, db)),
      getResultByRunId: (id: AuditRunId) => getResultByRunId(id).pipe(Effect.provideService(DbClient, db)),
    };
  }),
);
