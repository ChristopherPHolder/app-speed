import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CONDUCTOR_PATH, RequestAuditResponse } from '@app-speed/shared-conductor';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  private requestInProgress = false;
  requestAudit(auditDetails: any) {
    return this.http
      .post<RequestAuditResponse>(`${CONDUCTOR_PATH}/requestAudit`, auditDetails)
      .pipe(tap(() => (this.requestInProgress = false)));
  }
}
