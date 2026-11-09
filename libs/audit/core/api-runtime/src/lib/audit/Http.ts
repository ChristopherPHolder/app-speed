import { HttpApiBuilder } from 'effect/http-api';
import { Effect } from 'effect';
import { CoreApi } from '@app-speed/audit/core/api-contract';

import { scopedHistoryHandler } from './history/Http.js';

export const AuditGroupLive = HttpApiBuilder.group(CoreApi, 'audit', (handlers) =>
  Effect.gen(function* () {
    yield* Effect.logDebug('AuditGroupLive');
    return handlers.handle('history', scopedHistoryHandler(null));
  }),
);
