import { Injectable } from '@angular/core';
import { RxState } from '@rx-angular/state';
import { ResultModel, WebsocketResource } from 'data-access';
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { AuditRunStatus } from 'shared';
import { map, Observable } from 'rxjs';

type AdapterState = {
  reports: ResultModel;
  progress: AuditRunStatus;
};

@Injectable({
  providedIn: 'root'
})
export class SimpleAuditAdapter extends RxState<AdapterState> {

  readonly progress$: Observable<AuditRunStatus> = this.select('progress');
  readonly results$: Observable<ResultModel> = this.select('reports');
  constructor(private webSocket: WebsocketResource) {
    super();
    this.connect('progress', this.webSocket.progress$);
    this.connect('reports', this.webSocket.reports$);

  }
  initHandleAudit(targetUrl$: Observable<string>): void {
    const t = targetUrl$.pipe(map((targetUrl) => ({targetUrl, action: 'scheduleAudits'})));
    this.hold(t, auditParams =>  this.webSocket.scheduleAudit(auditParams));
  }
}
