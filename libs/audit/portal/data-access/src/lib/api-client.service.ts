import { Injectable } from '@angular/core';

import { FetchHttpClient, HttpApiClient } from '@effect/platform';
import { Effect, ManagedRuntime, Schema } from 'effect';

import { from } from 'rxjs';
import { Api } from '@app-speed/audit/api-contract';
import { AuditAuthoringSchema } from '@app-speed/audit/domain';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly runtime = ManagedRuntime.make(FetchHttpClient.layer);

  health() {
    return this.runtime.runPromise(
      Effect.gen(function* () {
        const apiClient = yield* HttpApiClient.make(Api);
        return yield* apiClient.health.get();
      }),
    );
  }

  scheduleAudit(auditDetails: unknown) {
    return from(
      this.runtime.runPromise(
        Effect.gen(function* () {
          const apiClient = yield* HttpApiClient.make(Api);
          const payload = yield* Schema.decodeUnknown(AuditAuthoringSchema)(auditDetails);
          return yield* apiClient.audit.schedule({ payload });
        }),
      ),
    );
  }
}
