import { Injectable } from '@angular/core';

import { FetchHttpClient, HttpClient, HttpClientRequest, HttpClientResponse } from '@effect/platform';
import { Effect, ManagedRuntime, Schema } from 'effect';

import { from } from 'rxjs';
import { ScheduleAuditResponseSchema } from '@app-speed/audit/contracts';
import { AuditDetails } from '@app-speed/audit/model';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly runtime = ManagedRuntime.make(FetchHttpClient.layer);

  private execute<A, E>(
    request: HttpClientRequest.HttpClientRequest,
    decoder: (response: HttpClientResponse.HttpClientResponse) => Effect.Effect<A, E>,
  ) {
    return Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient;
      const response = yield* client.execute(request);
      return yield* decoder(response);
    });
  }

  health() {
    return this.runtime.runPromise(
      this.execute(HttpClientRequest.get('/api/health'), HttpClientResponse.schemaBodyJson(Schema.String)),
    );
  }

  scheduleAudit(auditDetails: AuditDetails) {
    return from(
      this.runtime.runPromise(
        Effect.gen(function* () {
          const client = yield* HttpClient.HttpClient;
          const request = yield* HttpClientRequest.post('/api/audit/schedule').pipe(
            HttpClientRequest.bodyJson(auditDetails),
          );
          const response = yield* client.execute(request);
          return yield* HttpClientResponse.schemaBodyJson(ScheduleAuditResponseSchema)(response);
        }),
      ),
    );
  }
}
