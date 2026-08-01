import { Context, Effect, Schema } from 'effect';

import { QueryError } from './db';
import type { AuditResultRecord, AuditRunId, AuditRunRecord } from './audit-record';

export class AuditRepo extends Context.Service<
  AuditRepo,
  {
    claimNextRun: () => Effect.Effect<AuditRunRecord | null, QueryError | Schema.SchemaError>;
    hasScheduledRuns: () => Effect.Effect<boolean, QueryError>;
    getQueuePosition: (id: AuditRunId) => Effect.Effect<number | null, QueryError>;
    completeFailure: (id: AuditRunId, error: unknown, durationMs: number) => Effect.Effect<void, QueryError>;
    getRunById: (id: AuditRunId) => Effect.Effect<AuditRunRecord | null, QueryError | Schema.SchemaError>;
    getResultByRunId: (id: AuditRunId) => Effect.Effect<AuditResultRecord | null, QueryError | Schema.SchemaError>;
  }
>()('AuditRepo') {}

export { AuditRunIdSchema } from './audit-record';
export type { AuditRunId } from './audit-record';
