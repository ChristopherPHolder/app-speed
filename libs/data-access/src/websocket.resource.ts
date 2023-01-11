import { Injectable } from '@angular/core';
import { webSocket } from 'rxjs/webSocket';
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { AuditRequestParams, environment, KeyToAuditRunStatus, UfWsActions } from 'shared';
import { BehaviorSubject, filter, map, Observable, Observer } from 'rxjs';
import { ResultModel } from './result.model';

@Injectable({
  providedIn: 'root'
})
export class WebsocketResource {
  private readonly wsSubject = webSocket<UfWsActions>({
    url: environment.ufoSocketUrl,
    closingObserver: {
      next: () => {console.log('WebSocket Closed')}
    }
  });

  online$ = new BehaviorSubject(false);
  readonly progress$ = this.wsSubject.pipe(map(({type}) => type));
  readonly reports$: Observable<ResultModel> = this.wsSubject.pipe(
    filter(({type}) => type === KeyToAuditRunStatus.DONE),
    // @TODO check why types are not correctly inferred, consider type guards
    map(({payload}) => payload as ResultModel)
  );

  webSocketIsConnected = false;

  constructor() {
    this.online$.next(false);
  }

  scheduleAudit(auditParams: AuditRequestParams): void {
    if (!this.webSocketIsConnected) {
      this.wsSubject.subscribe(this.handleWebSocketMessages());
      this.online$.next(true);
      this.handleWebSocketOpen(auditParams);
    }
  }

  private handleWebSocketOpen(auditParams: AuditRequestParams) {
    console.log('Connection is open!');
    this.webSocketIsConnected = true;
    console.log('Sending request Audit Request:', auditParams);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.wsSubject.next(auditParams);
  }

  private handleWebSocketMessages(): Partial<Observer<unknown>> | undefined {
    return {
      next: message => this.handleWebSocketNext(message),
      error: error => this.handleWebSocketError(error),
      complete: () => this.handleWebSocketComplete()
    }
  }

  private handleWebSocketError(error: unknown): void {
    console.error(error);
    this.online$.next(false);
  }

  private handleWebSocketComplete(): void {
    console.log('Closing Web Socket Connection');
  }

  private receiveAuditResults(message: UfWsActions): void {
    console.log(message);
    this.wsSubject.complete();
  }


  // TODO Move to shared utils lib
  private hasProp<K extends PropertyKey>(obj: unknown, key: K | null | undefined): obj is Record<K, unknown> {
    return key != null && obj != null && typeof obj === 'object' && key in obj;
  }

  private handleWebSocketNext(socketResponse: unknown | UfWsActions): void {
    if (!this.hasProp(socketResponse, 'type')) {
      return console.log('Socket response unknown', socketResponse);
    }
    if (socketResponse.type === 'queued') {
      return console.log('Scheduled audit response', socketResponse);
    }
    if (socketResponse.type === 'done') {
      // TODO Add check for missing report results;
      return this.receiveAuditResults(socketResponse as UfWsActions);
    }
  }

}
