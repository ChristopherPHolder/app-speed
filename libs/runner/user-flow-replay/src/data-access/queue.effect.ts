import { Effect, Schema } from 'effect';
import { ReplayUserflowAuditSchema } from '@app-speed/shared-user-flow-replay/schema';
import { AuditRepo, type AuditRunId } from '@app-speed/server/db';

export const AuditRequestSchema = Schema.Struct({
  auditId: Schema.String,
  auditDetails: ReplayUserflowAuditSchema,
});

export const claimNextAudit = Effect.gen(function* () {
  const repo = yield* AuditRepo;
  const next = yield* repo.claimNextRun();
  if (!next) return null;
  return { auditId: next.id, auditDetails: next.data } as typeof AuditRequestSchema.Type;
});

export const completeAuditRun = (
  auditId: string,
  result: { status: 'SUCCESS' | 'FAILURE'; data: unknown; error?: unknown },
  durationMs: number,
) =>
  Effect.gen(function* () {
    const repo = yield* AuditRepo;
    yield* repo.completeRun(auditId as AuditRunId, result, durationMs);
  });
