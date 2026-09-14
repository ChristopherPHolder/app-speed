import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConsentBannerComponent } from './analytics/consent-banner.component';

@Component({
  imports: [RouterOutlet, ConsentBannerComponent],
  selector: 'app-root',
  template: `<router-outlet /><app-consent-banner />`,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
