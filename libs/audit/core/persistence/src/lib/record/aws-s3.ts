import { GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Config, Effect, Layer, Option, Schema } from 'effect';

import { AwsRegionSchema, RecordKeySchema, RecordPersistenceBucketSchema, type RecordKey } from './schema';
import { RecordPersistenceError, RecordPersistenceService } from './service';

const recordPersistenceBucketConfig = Config.string('RECORD_PERSISTENCE_BUCKET');
const awsRegionConfig = Config.string('AWS_REGION').pipe(Config.option);
const awsDefaultRegionConfig = Config.string('AWS_DEFAULT_REGION').pipe(Config.option);
const makeRecordKey = (value: string): RecordKey => Schema.decodeUnknownSync(RecordKeySchema)(value);

const resolveAwsRegion = Effect.gen(function* () {
  const region = yield* awsRegionConfig;
  if (Option.isSome(region)) {
    return yield* Schema.decodeUnknown(AwsRegionSchema)(region.value);
  }

  const defaultRegion = yield* awsDefaultRegionConfig;
  if (Option.isSome(defaultRegion)) {
    return yield* Schema.decodeUnknown(AwsRegionSchema)(defaultRegion.value);
  }

  return yield* Effect.fail(
    new RecordPersistenceError({
      operation: 'get',
      key: makeRecordKey('record-persistence-config:aws-region'),
      message: 'AWS_REGION or AWS_DEFAULT_REGION is required for S3 record persistence.',
    }),
  );
});

export const AwsS3RecordPersistenceService = Layer.effect(
  RecordPersistenceService,
  Effect.gen(function* () {
    const bucket = yield* recordPersistenceBucketConfig.pipe(
      Config.map(Schema.decodeUnknownSync(RecordPersistenceBucketSchema)),
    );
    const region = yield* resolveAwsRegion;
    const client = new S3Client({ region });

    return {
      makeRecordKey,
      decodeRecordKey: (value: string) => Schema.decodeUnknown(RecordKeySchema)(value),
      put: (key: RecordKey, value: string) =>
        Effect.tryPromise({
          try: () =>
            client.send(
              new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: value,
                ContentType: 'text/plain; charset=utf-8',
              }),
            ),
          catch: (cause) =>
            new RecordPersistenceError({
              operation: 'put',
              key,
              message: 'Failed to put record.',
              cause,
            }),
        }).pipe(Effect.asVoid),
      get: (key: RecordKey) =>
        Effect.tryPromise({
          try: async () => {
            try {
              const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
              return (await response.Body?.transformToString()) ?? null;
            } catch (error) {
              if (error instanceof NoSuchKey || (error as { name?: string }).name === 'NoSuchKey') {
                return null;
              }
              throw error;
            }
          },
          catch: (cause) =>
            new RecordPersistenceError({
              operation: 'get',
              key,
              message: 'Failed to get record.',
              cause,
            }),
        }),
    };
  }),
);
