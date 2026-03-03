import { environment } from '@app-speed/shared-environments';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, distinctUntilChanged, map, Observable, of, switchMap, timer } from 'rxjs';
import { RxEffects } from '@rx-angular/state/effects';

export const NETWORK_INFORMATION_TYPE = { UNKNOWN: 'unknown', NONE: 'none', WIFI: 'wifi' } as const;
type _ = keyof typeof NETWORK_INFORMATION_TYPE;
export type NetworkInformationType = (typeof NETWORK_INFORMATION_TYPE)[_];

@Injectable({
  providedIn: 'root',
})
export class NetworkConnection extends RxEffects {
  private readonly http = inject(HttpClient);
  private readonly state = new BehaviorSubject<NetworkInformationType>(NETWORK_INFORMATION_TYPE.UNKNOWN);
  readonly connectionType$: Observable<NetworkInformationType> = this.state.pipe(distinctUntilChanged());

  constructor() {
    super();
    this.register(timer(0, 5000).pipe(switchMap(() => this.isOnline())), (type) => this.state.next(type));
  }

  isOnline() {
    return this.http.get<number>(environment.isOnlineApi).pipe(
      map(() => NETWORK_INFORMATION_TYPE.WIFI),
      catchError(() => of(NETWORK_INFORMATION_TYPE.NONE)),
    );
  }
}
