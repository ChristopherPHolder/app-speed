import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface ScheduleAuditResponse {
  auditId: string;
  auditQueuePosition: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  requestAudit(auditDetails: any) {
    return this.http.post<ScheduleAuditResponse>('/api/audit/schedule', auditDetails);
  }
}
