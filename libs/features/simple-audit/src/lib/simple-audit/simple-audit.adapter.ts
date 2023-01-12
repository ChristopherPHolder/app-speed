import { Injectable } from '@angular/core';
import { RxState } from '@rx-angular/state';
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { ResultModel, WebsocketResource } from 'data-access';
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { AuditRunParams, AuditStatusType } from 'shared';
import { map, Observable } from 'rxjs';
import { NetworkConnection, NETWORK_INFORMATION_TYPE } from 'shared';

type AdapterState = {
  reports: ResultModel;
  progress: AuditStatusType;
  isOnline: boolean;
};

@Injectable({
  providedIn: 'root'
})
export class SimpleAuditAdapter extends RxState<AdapterState> {

  readonly progress$: Observable<AuditStatusType> = this.select('progress');
  readonly results$: Observable<ResultModel> = this.select('reports');
  readonly isOnline$: Observable<boolean> = this.select('isOnline');
  constructor(
    private webSocket: WebsocketResource,
    private networkConnection: NetworkConnection) {
    super();
    this.connect('progress', this.webSocket.progress$);
    this.connect('reports', this.webSocket.reports$);
    this.connect('isOnline', this.networkConnection.connectionType$.pipe(
      map(type => type === NETWORK_INFORMATION_TYPE.WIFI)
    ));

  }
  initHandleAudit(targetUrl$: Observable<string>): void {
    const t = targetUrl$.pipe(map((targetUrl) => ({targetUrl})));
    this.hold(t, auditParams => {
      this.webSocket.runAudit(auditParams as unknown as AuditRunParams)
      this.set({progress: 'scheduling'})
    });
  }
}
