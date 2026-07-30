import { HttpApiBuilder } from '@effect/platform';
import { Effect } from 'effect';
import { CoreApi } from '@app-speed/audit/core/api-contract';

export const HealthGroupLive = HttpApiBuilder.group(CoreApi, 'health', (handlers) =>
  Effect.gen(function* () {
    yield* Effect.logDebug('HealthGroupLive');
    return handlers.handle(
      'get',
      Effect.fn('api.health.get')(() => Effect.succeed('OK')),
    );
  }),
);
