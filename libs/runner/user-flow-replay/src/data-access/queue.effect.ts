import { Effect, Schema } from 'effect';
import { FetchHttpClient, HttpClient, HttpClientRequest, HttpClientResponse } from '@effect/platform';

const DequeueAuditSchema = Schema.Struct({ data: Schema.NullOr(Schema.Number) });

const dequeueAudit = Effect.gen(function* () {
  const client = (yield* HttpClient.HttpClient).pipe(HttpClient.filterStatusOk);
  return yield* HttpClientRequest.post('http://localhost:3000/api/conductor/dequeueAudits').pipe(
    client.execute,
    Effect.flatMap(HttpClientResponse.schemaBodyJson(DequeueAuditSchema)),
  );
}).pipe(Effect.scoped, Effect.provide(FetchHttpClient.layer));
