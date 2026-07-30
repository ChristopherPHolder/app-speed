import { Context, Effect, ParseResult, Schema } from 'effect';

import { RecordKeySchema, type RecordKey } from './schema';

export class RecordPersistenceError extends Schema.TaggedError<RecordPersistenceError>()('RecordPersistenceError', {
  operation: Schema.Literal('put', 'get'),
  key: RecordKeySchema,
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

export type RecordPersistence = {
  readonly makeRecordKey: (value: string) => RecordKey;
  readonly decodeRecordKey: (value: string) => Effect.Effect<RecordKey, ParseResult.ParseError>;
  readonly put: (key: RecordKey, value: string) => Effect.Effect<void, RecordPersistenceError>;
  readonly get: (key: RecordKey) => Effect.Effect<string | null, RecordPersistenceError>;
};

export class RecordPersistenceService extends Context.Tag('RecordPersistenceService')<
  RecordPersistenceService,
  RecordPersistence
>() {}
