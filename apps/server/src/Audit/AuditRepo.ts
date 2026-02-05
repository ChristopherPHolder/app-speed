import { Effect } from 'effect';
import { AuditIdType } from './Audit.js';
import { ReplayUserflowAudit } from '@app-speed/shared-user-flow-replay/schema';
import { AuditQueue } from './AuditQueue';
import { DbClient } from '@app-speed/server/db';

export class AuditRepo extends Effect.Service<AuditRepo>()('Audit', {
  effect: Effect.gen(function* () {
    const db = yield* DbClient;
    const queue = yield* AuditQueue;

    return {
      schedule: Effect.fn((audit: ReplayUserflowAudit) => {
        return Effect.gen(function* () {
          const auditId = yield* db
            .run((c) => c.audit.create({ data: { data: JSON.stringify(audit) } }))
            .pipe(Effect.map(({ id }) => id as AuditIdType));

          const auditQueuePosition = yield* queue.enqueue(auditId);

          return { auditId, auditQueuePosition };
        });
      }),
      findById: Effect.fn((auditId: AuditIdType) => {
        return db.run((c) => c.audit.findUnique({ where: { id: auditId } }));
      }),
      watchById: (auditId: AuditIdType) => queue.watch(auditId),
    };
  }),
}) {}
