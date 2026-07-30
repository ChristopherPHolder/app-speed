import { Effect, Layer } from 'effect';

import {
  AuditRepo,
  DbClient,
  RecordPersistenceService,
  type AuditRunId,
  type AuditRunListCursor,
  type AuditStatus,
} from '@app-speed/audit/core/persistence';

import { claimNextRun, completeRun, getQueuePosition, hasScheduledRuns, markRunInProgress } from './audit-repo/queue';
import { getRunDetailsById, getRunSummaryById, listRunsPage } from './audit-repo/runs';
import { getResultByRunId, getRunById } from './audit-repo/viewer';

export const UserFlowAuditRepoLive = Layer.effect(
  AuditRepo,
  Effect.gen(function* () {
    const db = yield* DbClient;
    const recordPersistence = yield* RecordPersistenceService;

    return {
      claimNextRun: () => claimNextRun().pipe(Effect.provideService(DbClient, db)),
      hasScheduledRuns: () => hasScheduledRuns().pipe(Effect.provideService(DbClient, db)),
      markRunInProgress: (id: AuditRunId) => markRunInProgress(id).pipe(Effect.provideService(DbClient, db)),
      getQueuePosition: (id: AuditRunId) => getQueuePosition(id).pipe(Effect.provideService(DbClient, db)),
      getRunSummaryById: (id: AuditRunId) => getRunSummaryById(id).pipe(Effect.provideService(DbClient, db)),
      getRunDetailsById: (id: AuditRunId) => getRunDetailsById(id).pipe(Effect.provideService(DbClient, db)),
      listRunsPage: (params: {
        limit: number;
        cursor: AuditRunListCursor | null;
        status: ReadonlyArray<AuditStatus> | null;
      }) => listRunsPage(params).pipe(Effect.provideService(DbClient, db)),
      completeRun: (
        id: AuditRunId,
        result: { status: 'SUCCESS' | 'FAILURE'; data: unknown; error?: unknown; reportHtml?: string | null },
        durationMs: number,
      ) =>
        completeRun(id, result, durationMs).pipe(
          Effect.provideService(DbClient, db),
          Effect.provideService(RecordPersistenceService, recordPersistence),
        ),
      getRunById: (id: AuditRunId) => getRunById(id).pipe(Effect.provideService(DbClient, db)),
      getResultByRunId: (id: AuditRunId) =>
        getResultByRunId(id).pipe(
          Effect.provideService(DbClient, db),
          Effect.provideService(RecordPersistenceService, recordPersistence),
        ),
    };
  }),
);
