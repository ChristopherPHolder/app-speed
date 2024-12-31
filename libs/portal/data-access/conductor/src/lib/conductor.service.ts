import { inject, Injectable } from '@angular/core';
import { webSocket } from 'rxjs/webSocket';
import { CONDUCTOR_SOCKET_HOST, CONDUCTOR_SOCKET_PATH } from '@app-speed/shared-conductor';
import { HttpClient } from '@angular/common/http';

declare const ngDevMode: boolean | undefined;

@Injectable({ providedIn: 'root' })
export class ConductorService {
  readonly uuid = crypto.randomUUID();
  readonly #socket = webSocket(`${CONDUCTOR_SOCKET_HOST}/${CONDUCTOR_SOCKET_PATH}?token=${this.uuid}`);
  constructor() {
    this.#socket.subscribe((event) => {
      console.log('[CONDUCTOR_SOCKET_HOST]', event);
    });
  }

  http = inject(HttpClient);
  scheduleAudit(auditDetails: string) {
    this.#socket.next({ event: 'schedule-audit', data: 'WOLOLO' });

    // this.#socket.next({ event: 'schedule-audit', data: 'WOLOLO' });

    // this.socket.open(`${CONDUCTOR_SOCKET_HOST}/${CONDUCTOR_SOCKET_PATH}`);
    // this.socket.send(JSON.stringify({ event: 'schedule-audit', data: auditDetails }));
  }
}
