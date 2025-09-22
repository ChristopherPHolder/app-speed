import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CONDUCTOR_PATH, ConductorStageChangeUnknownMessage, RequestAuditResponse } from '@app-speed/shared-conductor';
import { SocketService } from './socket.service';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private socket = inject<SocketService<ConductorStageChangeUnknownMessage, any>>(SocketService);

  requestAudit(auditDetails: any) {
    return this.http.post<RequestAuditResponse>(`${CONDUCTOR_PATH}/requestAudit`, auditDetails).pipe(
      tap((d) => {
        if (d.status === 'success') {
          this.auditProgress(d.message.auditId);
        }
      }),
    );
  }

  auditProgress(requestId: string) {
    this.socket.sendMessage({
      event: 'auditProgress',
      data: { requestId },
    });

    this.socket.messages$.subscribe((e) => console.log('I', e));
    this.socket.sendMessage({
      event: 'schedule-audit',
      data: { requestId },
    });
  }
}
