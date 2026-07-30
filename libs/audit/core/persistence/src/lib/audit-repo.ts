import { Context, Effect, ParseResult } from 'effect';

import { QueryError } from './db';
import type {
  AuditResultRecord,
  AuditRunDetailsRecord,
  AuditRunId,
  AuditRunListCursor,
  AuditRunRecord,
  AuditRunSummaryRecord,
  AuditStatus,
} from './audit-record';

export class AuditRepo extends Context.Tag('AuditRepo')<
  AuditRepo,
  {
    claimNextRun: () => Effect.Effect<AuditRunRecord | null, QueryError | ParseResult.ParseError>;
    hasScheduledRuns: () => Effect.Effect<boolean, QueryError>;
    markRunInProgress: (id: AuditRunId) => Effect.Effect<void, QueryError>;
    getQueuePosition: (id: AuditRunId) => Effect.Effect<number | null, QueryError | ParseResult.ParseError>;
    getRunSummaryById: (
      id: AuditRunId,
    ) => Effect.Effect<AuditRunSummaryRecord | null, QueryError | ParseResult.ParseError>;
    getRunDetailsById: (
      id: AuditRunId,
    ) => Effect.Effect<AuditRunDetailsRecord | null, QueryError | ParseResult.ParseError>;
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
    getResultByRunId: (
      id: AuditRunId,
    ) => Effect.Effect<AuditResultRecord | null, QueryError | ParseResult.ParseError>;
  }
>() {}

export { AuditRunIdSchema } from './audit-record';
export type { AuditRunId } from './audit-record';
