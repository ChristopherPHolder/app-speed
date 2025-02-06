import { Command, Options } from '@effect/cli';
import { Effect, pipe, Schema, flow } from 'effect';
import { FetchHttpClient, HttpClient, HttpClientRequest, HttpClientResponse } from '@effect/platform';
import { processAudit } from '@app-speed/runner-user-flow-replay';
import { ReplayUserflowAudit, ReplayUserflowAuditSchema } from '@app-speed/shared-user-flow-replay/schema';

const queue = Options.text('queue');

const DequeueAuditSchema = Schema.Struct({ data: Schema.NullOr(ReplayUserflowAuditSchema) });

const dequeueAudit = Effect.gen(function* () {
  const client = yield* HttpClient.HttpClient;
  return yield* HttpClientRequest.post('http://localhost:3000/api/conductor/dequeueAudits').pipe(
    client.execute,
    Effect.flatMap(HttpClientResponse.filterStatusOk),
    Effect.flatMap(HttpClientResponse.schemaBodyJson(DequeueAuditSchema)),
    Effect.map((response) => response.data),
  );
}).pipe(Effect.scoped, Effect.provide(FetchHttpClient.layer));

const submitAuditResults = (results: object) =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    return yield* HttpClientRequest.post('http://localhost:3000/api/conductor/auditComplete').pipe(
      HttpClientRequest.bodyJson(results),
      Effect.flatMap(client.execute),
      Effect.flatMap(HttpClientResponse.filterStatusOk),
      // Effect.flatMap(HttpClientResponse.schemaBodyJson(DequeueAuditSchema)),
      Effect.map((data) => data),
    );
  });

const processQueuedAudits = Effect.gen(function* () {
  yield* Effect.iterate(yield* dequeueAudit, {
    while: (audit) => audit !== null,
    body: (audit: ReplayUserflowAudit) =>
      processAudit(audit).pipe(
        Effect.map((results) => submitAuditResults(results)),
        Effect.flatMap(() => dequeueAudit),
      ),
  });
});

const command = Command.make('audit', { queue }, ({ queue }) => {
  return Effect.gen(function* () {
    yield* Effect.log(`Queue: ${queue}`);

    yield* processQueuedAudits;

    yield* Effect.log('Audits Complete');
    return void 0;
  });
});

export const cli = Command.run(command, {
  name: 'Audit Runner',
  version: 'v0.0.1',
});
