import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuditHistoryPage, DEFAULT_AUDIT_RUN_FILTER, ListAuditHistoryParams } from './audit-history.models';

@Injectable({ providedIn: 'root' })
export class AuditHistoryApiService {
  private readonly http = inject(HttpClient);

  listHistory(params: ListAuditHistoryParams = {}): Observable<AuditHistoryPage> {
    const limit = params.limit ?? 25;
    let queryParams = new HttpParams().set('limit', `${limit}`);

    if (params.cursor) {
      queryParams = queryParams.set('cursor', params.cursor);
    }

    if (params.status && params.status.length > 0 && params.status.length < DEFAULT_AUDIT_RUN_FILTER.length) {
      queryParams = queryParams.set('status', params.status.join(','));
    }

    return this.http.get<AuditHistoryPage>('/api/audit/runs', { params: queryParams });
  }
}
