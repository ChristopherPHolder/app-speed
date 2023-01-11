import { Injectable } from '@angular/core';
import { Ws } from 'data-access';
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import {
  environment,
  AUDIT_STATUS,
  UfWsActions,
  AUDIT_REQUEST,
  AuditRunParams,
  UfWsSendActions,
  UfWsRecieveActions,
} from 'shared';
import { filter, map, Observable, Observer } from 'rxjs';
import { ResultModel } from './result.model';

@Injectable({
  providedIn: 'root',
})
export class WebsocketResource {
  readonly progress$ = this.ws.messages$.pipe(map(({ type }) => type));
  readonly reports$: Observable<ResultModel> = this.ws.messages$.pipe(
    filter(({ type }) => type === AUDIT_STATUS.DONE),
    // @TODO check why types are not correctly inferred, consider type guards
    map(({ payload }) => payload as ResultModel),
  );

  constructor(private readonly ws: Ws<UfWsRecieveActions, UfWsSendActions>) {
    this.ws.init({
      url: environment.ufoSocketUrl,
      closingObserver: {
        next: () => {
          console.log('WebSocket Closed');
        },
      },
    });
  }

  runAudit(payload: AuditRunParams) {
    console.log('Sending request Audit Request:', payload);
    this.ws.send({ type: AUDIT_REQUEST.SCHEDULE_AUDIT, payload });
  }

}
