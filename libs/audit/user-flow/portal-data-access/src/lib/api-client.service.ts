import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Schema } from 'effect';
import { map, tap } from 'rxjs';
import { UserFlowAuditDefinitionSchema } from '@app-speed/audit/user-flow/domain';
const ScheduledSchema = Schema.Struct({
  auditId: Schema.String,
  auditQueuePosition: Schema.Number,
  claimToken: Schema.NullOr(Schema.String),
});
const AuditSchema = Schema.Struct({
  status: Schema.Literals(['SCHEDULED', 'IN_PROGRESS', 'COMPLETE']),
  audit: UserFlowAuditDefinitionSchema,
});
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  findAudit(auditId: string) {
    return this.http
      .get<unknown>(`/api/audits/user-flow/${encodeURIComponent(auditId)}`)
      .pipe(map((value) => Schema.decodeUnknownSync(AuditSchema)(value)));
  }
  scheduleAudit(auditDetails: unknown) {
    const payload = Schema.decodeUnknownSync(UserFlowAuditDefinitionSchema)(auditDetails);
    return this.http.post<unknown>('/api/audits/user-flow/schedule', payload).pipe(
      map((value) => Schema.decodeUnknownSync(ScheduledSchema)(value)),
      tap((run) => {
        if (run.claimToken) localStorage.setItem(`audit-claim:${run.auditId}`, run.claimToken);
      }),
    );
  }
}
