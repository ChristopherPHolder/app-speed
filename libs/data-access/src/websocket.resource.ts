import { Injectable } from '@angular/core';
import { webSocket } from 'rxjs/webSocket';
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import {
  AuditRequestParams,
  AuditRunStatus,
  environment,
  Reports,
  RunnerResponseMessage,
} from 'shared';
import { filter, map, Observer, startWith } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketResource {
  private readonly wsSubject = webSocket<RunnerResponseMessage>(environment.ufoSocketUrl);
  readonly progress$ = this.wsSubject.pipe(
    map(({action}) => action),
    startWith('idle' as AuditRunStatus ),
  );
  readonly reports$ = this.wsSubject.pipe(
    filter(({reports}) => !!reports),
    // @TODO fix typing issue
    map(({reports}) => reports as Reports)
  );

  toastText: string | null = null;
  webSocketIsConnected = false;

  scheduleAudit(auditParams: AuditRequestParams): void {
    if (!this.webSocketIsConnected) {
      this.wsSubject.subscribe(this.handleWebSocketMessages());
      this.handleWebSocketOpen(auditParams);
    }
  }

  private handleWebSocketOpen(auditParams: AuditRequestParams) {
    console.log('Connection is open!');
    this.toastText = `Scheduling user-flow audit`;
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
  }

  private handleWebSocketComplete(): void {
    console.log('Closing Web Socket Connection');
  }

  private receiveAuditResults(message: RunnerResponseMessage): void {
    console.log(message);
    this.wsSubject.complete();
  }


  // TODO Move to shared utils lib
  private hasProp<K extends PropertyKey>(obj: unknown, key: K | null | undefined): obj is Record<K, unknown> {
    return key != null && obj != null && typeof obj === 'object' && key in obj;
  }

  private handleWebSocketNext(socketResponse: unknown | RunnerResponseMessage): void {
    if (!this.hasProp(socketResponse, 'action') || !this.hasProp(socketResponse, 'message')) {
      //this.toastText = `Audit Failed`;
      return console.log('Socket response unknown', socketResponse);
    }
    if (socketResponse.action === 'scheduled') {
      //this.toastText = `Audit was successfully schedule\nRunning audit ...`;
      return console.log('Scheduled audit response', socketResponse);
    }
    if (socketResponse.action === 'completed') {
      // TODO Add check for missing report results;
      return this.receiveAuditResults(socketResponse as RunnerResponseMessage);
    }
  }

}
