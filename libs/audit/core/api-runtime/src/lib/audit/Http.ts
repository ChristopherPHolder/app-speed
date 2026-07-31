import { HttpApiBuilder } from '@effect/platform';
import { Effect } from 'effect';
import { CoreApi } from '@app-speed/audit/core/api-contract';

import { listRunsHandler, runByIdHandler, runDetailsByIdHandler } from './runs/Http.js';

export const AuditGroupLive = HttpApiBuilder.group(CoreApi, 'audit', (handlers) =>
  Effect.gen(function* () {
    yield* Effect.logDebug('AuditGroupLive');
    return handlers
      .handle('listRuns', listRunsHandler)
      .handle('runById', runByIdHandler)
      .handle('runDetailsById', runDetailsByIdHandler);
  }),
);
