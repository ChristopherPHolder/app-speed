import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { CONDUCTOR_SOCKET_HOST, CONDUCTOR_SOCKET_PATH } from '@app-speed/shared-conductor';

@Injectable({ providedIn: 'root' })
export class WebSocketService<I, O = I> {
  #webSocket: WebSocketSubject<I | O> | undefined;

  socket = webSocket(`${CONDUCTOR_SOCKET_HOST}/${CONDUCTOR_SOCKET_PATH}`);
}
