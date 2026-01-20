import { Effect } from 'effect';
import { AuditId, AuditNotFoundError } from './Audit.js';
import { DbClientService } from '../Db.js';

export class AuditRepo extends Effect.Service<AuditRepo>()('Audit', {
  effect: Effect.gen(function* () {
    const db = yield* DbClientService;

    return {
      schedule: Effect.fn(() =>
        db
          .run((c) => c.audit.create({ data: { name: 'input.name', status: 'SCHEDULED' } }))
          .pipe(Effect.map(({ id }) => id)),
      ),
      findById: Effect.fn((auditId: typeof AuditId.Type) =>
        db
          .run((c) => c.audit.findUnique({ where: { id: auditId } }))
          .pipe(
            Effect.filterOrFail(
              (queryResponse) => queryResponse !== null,
              () => new AuditNotFoundError({ id: auditId }),
            ),
            Effect.map(({ id }) => id),
          ),
      ),
    } as const;
  }),
}) {}
