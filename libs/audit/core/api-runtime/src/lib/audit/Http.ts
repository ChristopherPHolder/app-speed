import { HttpApiBuilder } from '@effect/platform';
import { Effect } from 'effect';
import { CoreApi } from '@app-speed/audit/core/api-contract';

import { findByIdHandler, watchByIdHandler } from './builder/Http.js';
import { listRunsHandler, runByIdHandler, runDetailsByIdHandler } from './runs/Http.js';
import { reportByIdHandler, resultByIdHandler } from './viewer/Http.js';

export const AuditGroupLive = HttpApiBuilder.group(CoreApi, 'audit', (handlers) =>
  Effect.gen(function* () {
    yield* Effect.logDebug('AuditGroupLive');
    return handlers
      .handle('findById', findByIdHandler)
      .handle('resultById', resultByIdHandler)
      .handle('reportById', reportByIdHandler)
      .handle('listRuns', listRunsHandler)
      .handle('runById', runByIdHandler)
      .handle('runDetailsById', runDetailsByIdHandler)
      .handle('watchById', watchByIdHandler);
  }),
);
