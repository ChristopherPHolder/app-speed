import { HttpApiBuilder } from '@effect/platform';
import { Effect } from 'effect';

import { Api } from '../Api.js';
import { findByIdHandler, scheduleHandler, watchByIdHandler } from './builder/Http.js';
import { listRunsHandler, runByIdHandler } from './runs/Http.js';
import { reportByIdHandler, resultByIdHandler } from './viewer/Http.js';

export const AuditGroupLive = HttpApiBuilder.group(Api, 'audit', (handlers) =>
  Effect.gen(function* () {
    yield* Effect.logDebug('AuditGroupLive');
    return handlers
      .handle('findById', findByIdHandler)
      .handle('resultById', resultByIdHandler)
      .handle('reportById', reportByIdHandler)
      .handle('schedule', scheduleHandler)
      .handle('listRuns', listRunsHandler)
      .handle('runById', runByIdHandler)
      .handle('watchById', watchByIdHandler);
  }),
);
