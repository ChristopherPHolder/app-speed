import { HttpApiBuilder, HttpApiError, HttpServerResponse } from '@effect/platform';
import { Api } from '../Api.js';
import { Effect, Stream } from 'effect';
import { AuditRepo } from './AuditRepo.js';
import { AuditNotFoundError } from './Audit';

export const AuditGroupLive = HttpApiBuilder.group(Api, 'audit', (handlers) =>
  Effect.gen(function* () {
    yield* Effect.logDebug('AuditGroupLive');
    const repo = yield* AuditRepo;

    return handlers
      .handle('findById', (request) =>
        repo.findById(request.path.id).pipe(
          Effect.filterOrFail(
            (r) => r !== null,
            () => new AuditNotFoundError({ id: request.path.id }),
          ),
          Effect.mapError(() => new HttpApiError.BadRequest()),
        ),
      )
      .handle('schedule', (request) =>
        repo.schedule(request.payload).pipe(Effect.mapError(() => new HttpApiError.BadRequest())),
      )
      .handle('watchById', (request) => {
        const stream = repo.watchById(request.path.id);
        return HttpServerResponse.stream(stream.pipe(Stream.map((p) => new TextEncoder().encode(`${p}`))));
      });
  }),
);
