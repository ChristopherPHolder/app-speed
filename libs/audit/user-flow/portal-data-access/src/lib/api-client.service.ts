import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Schema } from 'effect';
import { defer } from 'rxjs';
import { UserFlowAuditDefinitionSchema } from '@app-speed/audit/user-flow/domain';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);

  findAudit(auditId: string) {
    return this.http.get<{
      status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE';
      audit: typeof UserFlowAuditDefinitionSchema.Type;
      auditQueuePosition: number;
    }>(`/api/audits/user-flow/${encodeURIComponent(auditId)}`);
  }

  scheduleAudit(auditDetails: unknown) {
    return defer(() => {
      const payload = Schema.decodeUnknownSync(UserFlowAuditDefinitionSchema)(auditDetails);
      return this.http.post<{ auditId: string; auditQueuePosition: number }>('/api/audits/user-flow/schedule', payload);
    });
  }
}
