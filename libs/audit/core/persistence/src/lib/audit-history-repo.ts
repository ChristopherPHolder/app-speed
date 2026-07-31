import { Context, Effect, ParseResult } from 'effect';

import { QueryError } from './db';
import type { AuditRunListCursor, AuditRunSummaryRecord, AuditStatus } from './audit-record';
import type { AuditKind } from '@app-speed/audit/core/domain';

export class AuditHistoryRepo extends Context.Tag('AuditHistoryRepo')<
  AuditHistoryRepo,
  {
    listRunsPage: (params: {
      limit: number;
      cursor: AuditRunListCursor | null;
      status: ReadonlyArray<AuditStatus> | null;
      kind: AuditKind | null;
    }) => Effect.Effect<
      { items: ReadonlyArray<AuditRunSummaryRecord>; nextCursor: AuditRunListCursor | null },
      QueryError | ParseResult.ParseError
    >;
  }
>() {}
