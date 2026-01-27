import { Effect } from 'effect';
import { AuditIdType } from './Audit.js';
import { DbClientService } from '../Db.js';
import { ReplayUserflowAudit } from '@app-speed/shared-user-flow-replay/schema';

export class AuditRepo extends Effect.Service<AuditRepo>()('Audit', {
  effect: Effect.gen(function* () {
    const db = yield* DbClientService;

    return {
      schedule: Effect.fn((audit: ReplayUserflowAudit) => {
        return Effect.gen(function* () {
          const auditId = yield* db
            .run((c) => c.audit.create({ data: { data: JSON.stringify(audit) } }))
            .pipe(Effect.map(({ id }) => id as AuditIdType));
          const auditQueuePosition = 1;
          return { auditId, auditQueuePosition };
        });
      }),
      findById: Effect.fn((auditId: AuditIdType) =>
        db.run((c) => c.audit.findUnique({ where: { id: auditId } })).pipe(Effect.map((r) => (r === null ? r : r.id))),
      ),
    };
  }),
}) {}
