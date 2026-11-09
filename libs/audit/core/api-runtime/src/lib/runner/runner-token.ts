import { randomBytes } from 'node:crypto';
import { Config, Effect, Option, Redacted } from 'effect';
import { productionStorage } from '@app-speed/audit/core/persistence';

// Only the local child process receives this ephemeral credential. Remote runners require explicit configuration.
const localToken = randomBytes(32).toString('hex');
export const runnerApiToken = Effect.gen(function* () {
  const configured = yield* Config.option(Config.Redacted('RUNNER_API_TOKEN'));
  if (Option.isSome(configured)) return Redacted.value(configured.value);
  const local = (yield* Config.String('RUNNER_MANAGER_MODE').pipe(Config.withDefault('local'))) === 'local';
  return local && !(yield* productionStorage) ? localToken : '';
});
