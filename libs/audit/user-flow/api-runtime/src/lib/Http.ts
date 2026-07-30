import { HttpApiBuilder, HttpApiError } from '@effect/platform';
import { Effect } from 'effect';

import { RunnerLifecycle } from '@app-speed/audit/core/api-runtime';
import { AuditRepo } from '@app-speed/audit/core/persistence';
import { UserFlowApi } from '@app-speed/audit/user-flow/api-contract';
import { UserFlowAuditScheduler } from '@app-speed/audit/user-flow/persistence';

export const UserFlowAuditGroupLive = HttpApiBuilder.group(UserFlowApi, 'userFlowAudit', (handlers) =>
  handlers.handle(
    'scheduleUserFlowAudit',
    Effect.fn('api.userFlowAudit.schedule')((request) =>
      Effect.gen(function* () {
        const scheduler = yield* UserFlowAuditScheduler;
        const repo = yield* AuditRepo;
        const runnerLifecycle = yield* RunnerLifecycle;
        const auditId = yield* scheduler.schedule(request.payload);
        const auditQueuePosition = yield* repo.getQueuePosition(auditId);
        yield* runnerLifecycle.requestActivation;
        yield* Effect.annotateCurrentSpan({
          'audit.id': auditId,
          'audit.kind': 'user-flow',
          'queue.position': auditQueuePosition ?? 0,
        });
        return { auditId, auditQueuePosition: auditQueuePosition ?? 0 };
      }).pipe(
        Effect.withSpan('api.userFlowAudit.schedule'),
        Effect.catchTag('QueryError', () => new HttpApiError.BadRequest()),
        Effect.catchTag('ParseError', () => new HttpApiError.BadRequest()),
      ),
    ),
  ),
);
