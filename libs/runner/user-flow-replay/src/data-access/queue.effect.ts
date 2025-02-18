import { FlowResult } from 'lighthouse';
import { Effect, Schema } from 'effect';
import { HttpClient, HttpClientRequest, HttpClientResponse } from '@effect/platform';
import { ReplayUserflowAuditSchema } from '@app-speed/shared-user-flow-replay/schema';
import { UploadAuditResultsRequestBody } from '@app-speed/shared-conductor';

export const AuditRequestSchema = Schema.Struct({
  auditId: Schema.String,
  auditDetails: ReplayUserflowAuditSchema,
});

const DequeueAuditSchema = Schema.Struct({ data: Schema.NullOr(AuditRequestSchema) });

export const dequeueAudit = Effect.gen(function* () {
  const client = (yield* HttpClient.HttpClient).pipe(HttpClient.filterStatusOk);
  return yield* HttpClientRequest.post('http://localhost:3000/api/conductor/dequeueAudits').pipe(
    client.execute,
    Effect.flatMap(HttpClientResponse.schemaBodyJson(DequeueAuditSchema)),
    Effect.map((response) => response.data),
  );
});

export const submitAuditResults = (results: UploadAuditResultsRequestBody) =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    return yield* HttpClientRequest.post('http://localhost:3000/api/conductor/uploadResults').pipe(
      HttpClientRequest.bodyJson(results),
      Effect.flatMap(client.execute),
      Effect.flatMap(HttpClientResponse.filterStatusOk),
      Effect.map((data) => data),
    );
  });
