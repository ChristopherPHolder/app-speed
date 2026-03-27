import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuditRunSummary, AuditRunsPage, DEFAULT_AUDIT_RUN_FILTER, ListAuditRunsParams } from './audit-runs.models';

@Injectable({ providedIn: 'root' })
export class AuditRunsApiService {
  private readonly http = inject(HttpClient);

  listRuns(params: ListAuditRunsParams = {}): Observable<AuditRunsPage> {
    const limit = params.limit ?? 25;
    let queryParams = new HttpParams().set('limit', `${limit}`);

    if (params.cursor) {
      queryParams = queryParams.set('cursor', params.cursor);
    }

    if (params.status && params.status.length > 0 && params.status.length < DEFAULT_AUDIT_RUN_FILTER.length) {
      queryParams = queryParams.set('status', params.status.join(','));
    }

    return this.http.get<AuditRunsPage>('/api/audit/runs', { params: queryParams });
  }

  getRun(auditId: string): Observable<AuditRunSummary> {
    return this.http.get<AuditRunSummary>(`/api/audit/runs/${auditId}`);
  }
}
