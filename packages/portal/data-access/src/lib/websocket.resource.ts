import { AUDIT_REQUEST, AUDIT_STATUS, AuditRunParams, UfWsRecieveActions, UfWsSendActions } from '@app-speed/shared';
import { Injectable, inject } from '@angular/core';
import { environment } from '@app-speed/environments';
import { filter, map, Observable } from 'rxjs';
import { ResultModel } from './result.model';
import { Ws } from './ws';

// TODO this code is currently not being used, it should ether be deleted used!
@Injectable({
  providedIn: 'root',
})
export class WebsocketResource {
  private _initialized = false;
  private readonly ws: Ws<UfWsRecieveActions, UfWsSendActions> = inject(Ws);
  readonly progress$ = this.ws.messages$.pipe(map(({ type }) => type));
  readonly reports$: Observable<ResultModel> = this.ws.messages$.pipe(
    filter(({ type }) => type === AUDIT_STATUS.DONE),
    // @TODO check why types are not correctly inferred, consider type guards
    map(({ payload }) => payload as ResultModel),
  );

  constructor() {
    // @TODO init on runAudit to save bandwidth
    // this.init();
  }

  init() {
    if (!this._initialized) {
      this._initialized = true;
      this.ws.init(environment.ufoSocketUrl);
    }
  }

  runAudit(payload: AuditRunParams) {
    console.log('Sending request Audit Request:', payload);
    this.ws.send({ type: AUDIT_REQUEST.SCHEDULE_AUDIT, payload });
  }
}
