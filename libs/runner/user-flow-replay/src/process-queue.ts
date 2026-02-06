import { Cause, Duration, Effect, Exit } from 'effect';
import { claimNextAudit, completeAuditRun } from './data-access/queue.effect';
import { processAudit } from './process-audit';

export const processQueue = Effect.gen(function* () {
  yield* Effect.iterate(yield* claimNextAudit, {
    while: (auditRequest) => auditRequest !== null,
    body: (auditRequest) =>
      Effect.gen(function* () {
        const [duration, exit] = yield* Effect.timed(Effect.exit(processAudit(auditRequest)));
        const durationMs = Duration.toMillis(duration);

        if (Exit.isSuccess(exit)) {
          yield* completeAuditRun(
            auditRequest.auditId,
            { status: 'SUCCESS', data: exit.value },
            durationMs,
          );
        } else {
          yield* completeAuditRun(
            auditRequest.auditId,
            { status: 'FAILURE', data: null, error: Cause.pretty(exit.cause) },
            durationMs,
          );
        }

        yield* Effect.log(`Completed processing ${auditRequest.auditId}`);
        return yield* claimNextAudit;
      }),
  });
}).pipe(Effect.scoped);
