import { Injectable } from '@angular/core';
import { RxState } from '@rx-angular/state';
import { ResultModel, WebsocketResource } from 'data-access';
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { ResultProgress } from 'shared';
import { Observable} from 'rxjs';

type AdapterState = {
  reports: ResultModel;
  progress: ResultProgress;
};

@Injectable({
  providedIn: 'root'
})
export class SimpleAuditAdapter extends RxState<AdapterState> {

  readonly progress$: Observable<ResultProgress> = this.select('progress');
  readonly results$: Observable<ResultModel> = this.select('reports');
  constructor(private webSocket: WebsocketResource) {
    super();
    this.connect('progress', this.webSocket.progress$);
    this.connect('reports', this.webSocket.reports$);
  }

  handleAudit(auditUrl: string): void {
    const auditParams = {targetUrl: auditUrl, action: 'scheduleAudits'};
    this.webSocket.scheduleAudit(auditParams);
  }
}
