import { HttpApiBuilder } from 'effect/unstable/httpapi';
import { Effect } from 'effect';
import { CoreApi } from '@app-speed/audit/core/api-contract';

import { historyHandler } from './history/Http.js';

export const AuditGroupLive = HttpApiBuilder.group(CoreApi, 'audit', (handlers) =>
  Effect.gen(function* () {
    yield* Effect.logDebug('AuditGroupLive');
    return handlers.handle('history', historyHandler(null));
  }),
);
