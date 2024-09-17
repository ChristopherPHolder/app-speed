import { Injectable } from '@angular/core';
import { Observable, Subject, switchAll } from 'rxjs';
import { webSocket, WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService<I, O = I> {
  readonly #_webSocket = new Subject<WebSocketSubject<I | O>>();
  #webSocket: WebSocketSubject<I | O> | undefined;

  readonly messages$: Observable<I> = this.#_webSocket.asObservable().pipe(switchAll()) as Observable<I>;

  open(cfg: string | WebSocketSubjectConfig<I | O>): void {
    if (!cfg) {
      throw new Error('WS needs a URL to connect to.');
    }
    if (this.#webSocket) {
      throw new Error('WS already initialized');
    }

    if (typeof cfg === 'string') {
      cfg = {
        url: cfg,
      };
    }
    this.#_webSocket.subscribe(console.log);

    this.#webSocket = webSocket<I | O>(cfg);
    this.#_webSocket.next(this.#webSocket);
  }

  close(): void {
    if (!this.#webSocket) {
      throw new Error('WS not initialized');
    }
    this.#webSocket.complete();
  }

  send(message: O): void {
    if (!this.#webSocket) {
      throw new Error('WS not initialized');
    }
    this.#webSocket.next(message);
  }
}
