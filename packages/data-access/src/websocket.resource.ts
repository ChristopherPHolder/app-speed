import { AUDIT_REQUEST, AuditRunParams } from '@app-speed/shared';
import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from '@app-speed/environments';
import { Observable, Subject, switchAll } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebsocketResource {
  #socket: WebSocket;

  constructor() {
    const socket = new WebSocket(environment.ufoSocketUrl);

    socket.onopen = (e) => {
      console.log('Websocket opened', e);
    };
    socket.onmessage = (e) => {
      console.log('Websocket message', e);
    };
    socket.onclose = (e) => {
      console.log('Websocket closed', e);
    };
    socket.onerror = (e) => {
      console.log('Websocket error', e);
    };
    this.#socket = socket;
  }

  runAudit(payload: object) {
    console.log('Sending request Audit Request:', payload);
    this.#socket.send(JSON.stringify({ action: AUDIT_REQUEST.SCHEDULE_AUDIT, content: payload }));
  }
}
