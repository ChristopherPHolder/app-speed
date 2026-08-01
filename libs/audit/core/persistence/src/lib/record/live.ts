import { Config, Effect, Layer, Option, Match } from 'effect';

import { AwsS3RecordPersistenceService } from './aws-s3';
import { InMemoryRecordPersistenceService } from './in-memory';
const recordPersistenceModeConfig = Config.option(Config.literals(['memory', 's3'], 'RECORD_PERSISTENCE_MODE'));

export const RecordPersistenceLive = Layer.unwrap(
  Effect.gen(function* () {
    const configuredMode = yield* recordPersistenceModeConfig;

    const mode = Option.isSome(configuredMode) ? configuredMode.value : 'memory';
    return Match.value(mode).pipe(
      Match.when('s3', () => AwsS3RecordPersistenceService),
      Match.when('memory', () => InMemoryRecordPersistenceService),
      Match.exhaustive,
    );
  }),
);
