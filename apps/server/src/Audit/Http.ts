import { HttpApiBuilder, HttpApiError } from '@effect/platform';
import { Api } from '../Api.js';
import { Effect } from 'effect';
import { AuditRepo } from './AuditRepo.js';

export const AuditGroupLive = HttpApiBuilder.group(Api, 'audit', (handlers) =>
  Effect.gen(function* () {
    yield* Effect.logDebug('AuditGroupLive');
    const repo = yield* AuditRepo;

    return handlers
      .handle('findById', (request) =>
        repo.findById(request.path.id).pipe(
          Effect.mapError(() => new HttpApiError.BadRequest()),
          Effect.filterOrFail(
            (r) => r !== null,
            () => new HttpApiError.NotFound(),
          ),
        ),
      )
      .handle('schedule', (request) =>
        repo.schedule(request.payload).pipe(Effect.mapError(() => new HttpApiError.BadRequest())),
      );
  }),
);
