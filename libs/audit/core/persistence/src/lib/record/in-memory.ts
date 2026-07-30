import { Effect, Layer, Schema } from 'effect';

import { RecordKeySchema, type RecordKey } from './schema';
import { RecordPersistenceService } from './service';

export const InMemoryRecordPersistenceService = Layer.sync(RecordPersistenceService, () => {
  const records = new Map<string, string>();

  return {
    makeRecordKey: (value: string) => Schema.decodeUnknownSync(RecordKeySchema)(value),
    decodeRecordKey: (value: string) => Schema.decodeUnknown(RecordKeySchema)(value),
    put: (key: RecordKey, value: string) => Effect.sync(() => void records.set(key, value)),
    get: (key: RecordKey) => Effect.sync(() => records.get(key) ?? null),
  };
});
