import { Schema } from 'effect';

export const RecordKeySchema = Schema.NonEmptyString.pipe(Schema.brand('RecordKey'));
export type RecordKey = typeof RecordKeySchema.Type;

export const RecordPersistenceModeSchema = Schema.Literal('memory', 's3').pipe(Schema.brand('RecordPersistenceMode'));
export type RecordPersistenceMode = typeof RecordPersistenceModeSchema.Type;

export const RecordPersistenceBucketSchema = Schema.NonEmptyString.pipe(Schema.brand('RecordPersistenceBucket'));
export type RecordPersistenceBucket = typeof RecordPersistenceBucketSchema.Type;

export const AwsRegionSchema = Schema.NonEmptyString.pipe(Schema.brand('AwsRegion'));
export type AwsRegion = typeof AwsRegionSchema.Type;
