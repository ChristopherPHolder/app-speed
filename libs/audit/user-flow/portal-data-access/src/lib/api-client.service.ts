import { Injectable } from '@angular/core';

import { FetchHttpClient, HttpApiClient } from '@effect/platform';
import { Effect, ManagedRuntime, Schema } from 'effect';

import { from } from 'rxjs';
import { UserFlowApi } from '@app-speed/audit/user-flow/api-contract';
import { UserFlowAuditDefinitionSchema } from '@app-speed/audit/user-flow/domain';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly runtime = ManagedRuntime.make(FetchHttpClient.layer);

  scheduleAudit(auditDetails: unknown) {
    return from(
      this.runtime.runPromise(
        Effect.gen(function* () {
          const apiClient = yield* HttpApiClient.make(UserFlowApi);
          const payload = yield* Schema.decodeUnknown(UserFlowAuditDefinitionSchema)(auditDetails);
          return yield* apiClient.userFlowAudit.scheduleUserFlowAudit({ payload });
        }),
      ),
    );
  }
}
