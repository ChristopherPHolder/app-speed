import { Injectable } from '@angular/core';
import { Observable, Subject, switchAll } from 'rxjs';
import { webSocket, WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';
import { RxEffects } from '@rx-angular/state/effects';
import { NETWORK_INFORMATION_TYPE, NetworkConnection } from './network-connetion';

@Injectable({
  providedIn: 'root',
})
export class Ws<I, O = I> extends RxEffects {
  private readonly _ws = new Subject<WebSocketSubject<I | O>>();
  private webSocket: WebSocketSubject<I | O> | undefined = undefined;
  readonly messages$: Observable<I> = this._ws.pipe(switchAll()) as Observable<I>;

  constructor(private readonly networkConnection: NetworkConnection) {
    super();
  }

  init(url: string | WebSocketSubjectConfig<I | O>) {
    if (!url) {
      throw new Error('WS needs a URL to connect to.');
    }
    if (this.webSocket) {
      throw new Error('WS already initialized');
    }

    this.register(
      this.networkConnection.connectionType$,
      connection => {
        if (connection === NETWORK_INFORMATION_TYPE.WIFI) {
          this.webSocket = webSocket<I | O>(url);
          this._ws.next(this.webSocket);
        } else {
          this.webSocket && this.webSocket.complete();
        }
      }
    );
  }

  close() {
    if (!this.webSocket) {
      throw new Error('WS not initialized');
    }
    this.webSocket.complete();
  }
  send(msg: O) {
    if (!this.webSocket) {
      throw new Error('WS not initialized');
    }
    this.webSocket.next(msg);
  }
}
