import { HttpApiBuilder } from '@effect/platform';
import { Api } from '../Api.js';
import { Effect } from 'effect';
import { AuditRepo } from './AuditRepo.js';

export const AuditGroupLive = HttpApiBuilder.group(Api, 'audit', (handlers) =>
  Effect.gen(function* () {
    yield* Effect.logDebug('AuditGroupLive');
    const repo = yield* AuditRepo;
    return handlers
      .handle('findById', (request) => repo.findById(request.path.id))
      .handle('schedule', (_request) => repo.schedule());
  }),
);