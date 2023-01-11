import { setInterval } from '@rx-angular/cdk/zone-less/browser';
import { Injectable, OnDestroy } from '@angular/core';
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { environment } from 'shared';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

const NETWORK_INFORMATION_TYPE = { UNKNOWN: 'unknown', NONE: 'none', WIFI: 'wifi' } as const;
type _ = keyof typeof NETWORK_INFORMATION_TYPE;
export type NetworkInformationType = typeof NETWORK_INFORMATION_TYPE[_];

@Injectable({
  providedIn: 'root',
})
export class NetworkConnection implements OnDestroy {

  private asyncID: number = NaN;
  private readonly sub = new Subscription();
  private readonly state = new BehaviorSubject<NetworkInformationType>(NETWORK_INFORMATION_TYPE.UNKNOWN);
  readonly isOnline$: Observable<NetworkInformationType> = this.state.asObservable();

  constructor(private http: HttpClient) {
    this.asyncID = setInterval(() => {
      this.sub.add(this.isOnline().subscribe(
        () => this.state.next(NETWORK_INFORMATION_TYPE.WIFI),
        () => this.state.next(NETWORK_INFORMATION_TYPE.NONE),
        ),
      );
    }, 5000);
  }

  isOnline(): Observable<any> {
    return this.http.get(environment.isOnlineApi);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    clearInterval(this.asyncID);
  }
}
