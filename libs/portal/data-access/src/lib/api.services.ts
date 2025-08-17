import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CONDUCTOR_PATH, RequestAuditResponse } from '@app-speed/shared-conductor';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  requestAudit(auditDetails: any) {
    return this.http.post<RequestAuditResponse>(`${CONDUCTOR_PATH}/requestAudit`, auditDetails);
  }
}
