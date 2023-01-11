import { Injectable } from '@angular/core';
import { distinctUntilChanged, Subject, switchAll } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { RxEffects } from '@rx-angular/state/effects';
import { NETWORK_INFORMATION_TYPE, NetworkConnection } from './network-connetion';

@Injectable({
  providedIn: 'root',
})
export class Ws<T> extends RxEffects {
  private readonly _ws = new Subject<WebSocketSubject<T>>();
  private url = '';
  private webSocket: WebSocketSubject<T> | undefined = undefined;
  readonly messages$ = this._ws.pipe(switchAll());

  constructor(private readonly networkConnection: NetworkConnection) {
    super();
  }

  init(url: string) {
    if (!url) {
      throw new Error('WS needs a URL to connect to.');
    }
    if (this.webSocket) {
      throw new Error('WS already initialized');
    }

    this.register(
      this.networkConnection.isOnline$.pipe(distinctUntilChanged()),
      connection => {
        if (connection === NETWORK_INFORMATION_TYPE.WIFI) {
          this.webSocket = webSocket<T>(url);
          this._ws.next(this.webSocket);
        } else {
          this.webSocket && this.webSocket.complete();
        }
      }
    );
  }
}
