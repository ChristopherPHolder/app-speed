// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { environment } from 'shared';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, switchMap, timer } from 'rxjs';
import { RxEffects } from '@rx-angular/state/effects';

export const NETWORK_INFORMATION_TYPE = { UNKNOWN: 'unknown', NONE: 'none', WIFI: 'wifi' } as const;
type _ = keyof typeof NETWORK_INFORMATION_TYPE;
export type NetworkInformationType = typeof NETWORK_INFORMATION_TYPE[_];

@Injectable({
  providedIn: 'root',
})
export class NetworkConnection extends RxEffects {
  private readonly state = new BehaviorSubject<NetworkInformationType>(NETWORK_INFORMATION_TYPE.UNKNOWN);
  readonly isOnline$: Observable<NetworkInformationType> = this.state.asObservable();

  constructor(private http: HttpClient) {
    super();
    this.register(timer(0, 5000).pipe(switchMap(() => this.isOnline())), {
      next: () => this.state.next(NETWORK_INFORMATION_TYPE.WIFI),
      error: () => this.state.next(NETWORK_INFORMATION_TYPE.NONE),
    });
  }

  isOnline() {
    return this.http.get<number>(environment.isOnlineApi);
  }
}
