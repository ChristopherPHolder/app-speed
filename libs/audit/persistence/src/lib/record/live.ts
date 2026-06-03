import { Config, Effect, Layer, Option, Match } from 'effect';

import { AwsS3RecordPersistenceService } from './aws-s3';
import { InMemoryRecordPersistenceService } from './in-memory';
const recordPersistenceModeConfig = Config.option(Config.literal('memory', 's3')('RECORD_PERSISTENCE_MODE'));

export const RecordPersistenceLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const configuredMode = yield* recordPersistenceModeConfig;

    return Match.value(Option.getOrElse(configuredMode, () => 'memory' as const)).pipe(
      Match.when('s3', () => AwsS3RecordPersistenceService),
      Match.when('memory', () => InMemoryRecordPersistenceService),
      Match.exhaustive,
    );
  }),
);
