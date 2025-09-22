import { Injectable } from '@angular/core';
import { webSocket } from 'rxjs/webSocket';
import { CONDUCTOR_PATH, CONDUCTOR_SOCKET_HOST } from '@app-speed/shared-conductor';
import { shareReplay, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SocketService<I, O> {
  private connected = false;
  private readonly webSocket$ = webSocket<I | O>(
    `${CONDUCTOR_SOCKET_HOST}/${CONDUCTOR_PATH}?token=${crypto.randomUUID()}`,
  );

  private connection = this.webSocket$.pipe(
    tap((e) => {
      // @ts-ignore
      if (e.event === 'connected') {
        console.log('Connected', e);
        this.connected = true;
      }
    }),
    shareReplay(),
  );

  readonly messages$ = this.webSocket$.pipe(tap());

  sendMessage(message: O) {
    this.webSocket$.next(message);
  }
}
