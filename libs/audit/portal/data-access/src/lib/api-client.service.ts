import { Injectable } from '@angular/core';

import { FetchHttpClient, HttpApiClient } from '@effect/platform';
import { Effect, ManagedRuntime, Schema } from 'effect';

import { from } from 'rxjs';
import { Api, ScheduleAuditRequestSchema } from '@app-speed/audit/api-contract';
import type { AuditDetails } from '@app-speed/audit/model';

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

  scheduleAudit(auditDetails: AuditDetails) {
    return from(
      this.runtime.runPromise(
        Effect.gen(function* () {
          const apiClient = yield* HttpApiClient.make(Api);
          const payload = yield* Schema.decodeUnknown(ScheduleAuditRequestSchema)(auditDetails);
          return yield* apiClient.audit.schedule({ payload });
        }),
      ),
    );
  }
}
