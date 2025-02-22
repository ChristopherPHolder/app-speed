import { Injectable } from '@angular/core';
import { webSocket } from 'rxjs/webSocket';
import { CONDUCTOR_SOCKET_HOST, CONDUCTOR_SOCKET_PATH } from '@app-speed/shared-conductor';

@Injectable({ providedIn: 'root' })
export class SocketService<I, O> {
  private readonly webSocket$ = webSocket<I | O>(
    `${CONDUCTOR_SOCKET_HOST}/${CONDUCTOR_SOCKET_PATH}?token=${crypto.randomUUID()}`,
  );

  readonly messages$ = this.webSocket$.asObservable();

  sendMessage(message: O) {
    this.webSocket$.next(message);
  }
}
