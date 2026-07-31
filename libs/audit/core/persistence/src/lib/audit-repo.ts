import { Context, Effect, ParseResult } from 'effect';

import { QueryError } from './db';
import type { AuditResultRecord, AuditRunId, AuditRunRecord } from './audit-record';

export class AuditRepo extends Context.Tag('AuditRepo')<
  AuditRepo,
  {
    claimNextRun: () => Effect.Effect<AuditRunRecord | null, QueryError | ParseResult.ParseError>;
    hasScheduledRuns: () => Effect.Effect<boolean, QueryError>;
    getQueuePosition: (id: AuditRunId) => Effect.Effect<number | null, QueryError | ParseResult.ParseError>;
    completeFailure: (id: AuditRunId, error: unknown, durationMs: number) => Effect.Effect<void, QueryError>;
    getRunById: (id: AuditRunId) => Effect.Effect<AuditRunRecord | null, QueryError | ParseResult.ParseError>;
    getResultByRunId: (id: AuditRunId) => Effect.Effect<AuditResultRecord | null, QueryError | ParseResult.ParseError>;
  }
>() {}

export { AuditRunIdSchema } from './audit-record';
export type { AuditRunId } from './audit-record';
