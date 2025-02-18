import { Effect } from 'effect';
import { dequeueAudit, submitAuditResults } from './data-access/queue.effect';
import { processAudit } from './process-audit';
import { FetchHttpClient } from '@effect/platform';

export const processQueue = Effect.gen(function* () {
  yield* Effect.iterate(yield* dequeueAudit, {
    while: (auditRequest) => auditRequest !== null,
    body: (auditRequest) =>
      Effect.gen(function* () {
        yield* processAudit(auditRequest).pipe(
          Effect.flatMap((auditResult) =>
            submitAuditResults({
              data: {
                auditId: auditRequest.auditId,
                auditResult: { status: 'success', result: auditResult.result },
              },
            }),
          ),
        );

        yield* Effect.log(`Completed processing ${auditRequest.auditId}`);
        return yield* dequeueAudit;
      }),
  });
}).pipe(Effect.scoped, Effect.provide(FetchHttpClient.layer));
