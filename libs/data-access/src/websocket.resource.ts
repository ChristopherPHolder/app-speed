import { Injectable } from '@angular/core';
import { Ws } from 'shared';
import { AUDIT_REQUEST, AUDIT_STATUS, AuditRunParams, environment, UfWsRecieveActions, UfWsSendActions } from 'shared';
import { filter, map, Observable } from 'rxjs';
import { ResultModel } from './result.model';

@Injectable({
  providedIn: 'root',
})
export class WebsocketResource {
  private _initialized = false;
  readonly progress$ = this.ws.messages$.pipe(map(({ type }) => type));
  readonly reports$: Observable<ResultModel> = this.ws.messages$.pipe(
    filter(({ type }) => type === AUDIT_STATUS.DONE),
    // @TODO check why types are not correctly inferred, consider type guards
    map(({ payload }) => payload as ResultModel),
  );

  constructor(private readonly ws: Ws<UfWsRecieveActions, UfWsSendActions>) {
    // @TODO init on runAudit to save bandwidth
    this.init();
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
