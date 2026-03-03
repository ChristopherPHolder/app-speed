import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SchedulerService } from './scheduler/scheduler.service';
import { tap } from 'rxjs';

export interface ScheduleAuditResponse {
  auditId: string;
  auditQueuePosition: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private scheduler = inject(SchedulerService);

  requestAudit(auditDetails: any) {
    return this.http.post<ScheduleAuditResponse>('/api/audit/schedule', auditDetails).pipe(
      tap((d) => this.scheduler.watchAudit(d.auditId)),
    );
  }
}
