import { inject, Injectable } from '@angular/core';
import { WebSocketService } from './web-socket.service';
import { environment } from '@app-speed/environments';

type SchedulerRequest = any;
type SchedulerResponse = any;

@Injectable({ providedIn: 'root' })
export class SchedulerService {
  #initialized = false;

  readonly #webSocket = inject(WebSocketService<SchedulerRequest, SchedulerResponse>);

  constructor() {
    this.init();
  }

  init() {
    if (!this.#initialized) {
      this.#initialized = true;
      this.#webSocket.open(environment.ufoSocketUrl);
    }
  }

  scheduleAudit(auditDetails: any): void {
    if (!this.#webSocket) {
      throw new Error('WS not initialized');
    }
    this.#webSocket.messages$.subscribe(console.log);
    const message = {
      action: 'schedule_audit',
      auditDetails,
    };
    console.log('Message', message);
    this.#webSocket.send(message);
  }
}
