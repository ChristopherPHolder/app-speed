import { sql } from 'drizzle-orm';
import { Effect, Layer, Schema } from 'effect';
import { SqliteDbClient } from '../sqlite-db';
import { RecordKeySchema } from './schema';
import { RecordPersistenceError, RecordPersistenceService } from './service';

export const SqliteRecordPersistenceLive = Layer.effect(RecordPersistenceService)(
  Effect.gen(function* () {
    const db = yield* SqliteDbClient;
    return {
      makeRecordKey: Schema.decodeUnknownSync(RecordKeySchema),
      decodeRecordKey: Schema.decodeUnknownEffect(RecordKeySchema),
      put: (key, value) =>
        db
          .run((client) =>
            client.run(
              sql`INSERT INTO records (key, value) VALUES (${key}, ${value}) ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
            ),
          )
          .pipe(
            Effect.asVoid,
            Effect.mapError(
              (cause) => new RecordPersistenceError({ operation: 'put', key, message: cause.message, cause }),
            ),
          ),
      get: (key) =>
        db
          .run(async (client) => {
            const rows = await client.all<{ value: string }>(sql`SELECT value FROM records WHERE key=${key}`);
            return rows[0]?.value ?? null;
          })
          .pipe(
            Effect.mapError(
              (cause) => new RecordPersistenceError({ operation: 'get', key, message: cause.message, cause }),
            ),
          ),
    };
  }),
);
