import { Context, Effect, ParseResult } from 'effect';

import { QueryError } from './db';
import type {
  AuditRunDetailsRecord,
  AuditRunId,
  AuditRunListCursor,
  AuditRunSummaryRecord,
  AuditStatus,
} from './audit-record';

export class AuditHistoryRepo extends Context.Tag('AuditHistoryRepo')<
  AuditHistoryRepo,
  {
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
      { items: ReadonlyArray<AuditRunSummaryRecord>; nextCursor: AuditRunListCursor | null },
      QueryError | ParseResult.ParseError
    >;
  }
>() {}
