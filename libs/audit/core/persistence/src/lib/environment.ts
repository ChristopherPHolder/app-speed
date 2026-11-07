import { Config, Effect } from 'effect';

// Deployed development images also use NODE_ENV=production. Validate overrides
// so a misspelled production environment cannot silently select empty storage.
export const productionStorage = Effect.gen(function* () {
  const environment = yield* Config.Literals(
    ['', 'development', 'test', 'staging', 'preview', 'production', 'prod'],
    'APP_ENV',
  ).pipe(Config.withDefault(''));
  const nodeEnvironment = yield* Config.String('NODE_ENV').pipe(Config.withDefault('development'));
  return (
    environment === 'production' || environment === 'prod' || (environment === '' && nodeEnvironment === 'production')
  );
});
