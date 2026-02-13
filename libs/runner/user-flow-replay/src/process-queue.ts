import { Cause, Duration, Effect, Exit, Option } from 'effect';
import { claimNextAudit, completeAuditRun } from './data-access/queue.effect';
import { processAudit } from './process-audit';

const toErrorPayload = (cause: Cause.Cause<unknown>) => {
  const failure = Cause.failureOption(cause);
  if (Option.isSome(failure)) {
    const error = failure.value;
    if (error instanceof Error) {
      return { name: error.name, message: error.message, stack: error.stack ?? '' };
    }
    if (typeof error === 'string') {
      return { name: 'Error', message: error, stack: '' };
    }
    if (error && typeof error === 'object') {
      const record = error as Record<string, unknown>;
      return {
        name: typeof record['name'] === 'string' ? record['name'] : 'Error',
        message: typeof record['message'] === 'string' ? record['message'] : Cause.pretty(cause),
        stack: typeof record['stack'] === 'string' ? record['stack'] : '',
      };
    }
  }

  return { name: 'Error', message: Cause.pretty(cause), stack: '' };
};

export const processQueue = Effect.flatMap(claimNextAudit, (firstAudit) =>
  Effect.iterate(firstAudit, {
    while: (auditRequest) => auditRequest !== null,
    body: (auditRequest) =>
      Effect.gen(function* () {
        yield* Effect.annotateCurrentSpan({ 'audit.id': auditRequest.auditId });
        const [duration, exit] = yield* Effect.timed(Effect.exit(processAudit(auditRequest)));
        const durationMs = Duration.toMillis(duration);
        yield* Effect.annotateCurrentSpan({ 'audit.duration_ms': durationMs });

        if (Exit.isSuccess(exit)) {
          yield* Effect.annotateCurrentSpan({ 'audit.status': 'SUCCESS' });
          yield* completeAuditRun(auditRequest.auditId, { status: 'SUCCESS', data: exit.value }, durationMs);
        } else {
          const error = toErrorPayload(exit.cause);
          yield* Effect.annotateCurrentSpan({
            'audit.status': 'FAILURE',
            'error.name': error.name,
          });
          yield* completeAuditRun(auditRequest.auditId, { status: 'FAILURE', data: null, error }, durationMs);
        }

        yield* Effect.log(`Completed processing ${auditRequest.auditId}`);
        return yield* claimNextAudit;
      }).pipe(Effect.withSpan('runner.queue.processItem')),
  }),
).pipe(Effect.withSpan('runner.queue.loop'), Effect.scoped);
