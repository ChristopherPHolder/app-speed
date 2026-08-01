import { Context, Effect, Schema } from 'effect';

import { RecordKeySchema, type RecordKey } from './schema';

export class RecordPersistenceError extends Schema.TaggedErrorClass<RecordPersistenceError>()(
  'RecordPersistenceError',
  {
    operation: Schema.Literals(['put', 'get']),
    key: RecordKeySchema,
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  },
) {}

export type RecordPersistence = {
  readonly makeRecordKey: (value: string) => RecordKey;
  readonly decodeRecordKey: (value: string) => Effect.Effect<RecordKey, Schema.SchemaError>;
  readonly put: (key: RecordKey, value: string) => Effect.Effect<void, RecordPersistenceError>;
  readonly get: (key: RecordKey) => Effect.Effect<string | null, RecordPersistenceError>;
};

export class RecordPersistenceService extends Context.Service<RecordPersistenceService, RecordPersistence>()(
  'RecordPersistenceService',
) {}
