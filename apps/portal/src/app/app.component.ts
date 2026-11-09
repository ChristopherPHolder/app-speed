import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter, map, take } from 'rxjs';
import { ConsentBannerComponent } from './analytics/consent-banner.component';

@Component({
  imports: [RouterOutlet, ConsentBannerComponent],
  selector: 'app-root',
  template: `
    <router-outlet />
    @if (ready()) {
      <app-consent-banner />
    } @else {
      <div class="app-loader" role="status">
        <span class="app-loader__spinner" aria-hidden="true"></span>
        <span class="app-loader__label">Loading App Speed…</span>
      </div>
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  /** Becomes true once the initial navigation settles, so nothing renders before the page has its layout. */
  protected readonly ready = toSignal(
    inject(Router).events.pipe(
      filter(
        (event) =>
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError ||
          event instanceof NavigationSkipped,
      ),
      take(1),
      map(() => true),
    ),
    { initialValue: false },
  );
}
