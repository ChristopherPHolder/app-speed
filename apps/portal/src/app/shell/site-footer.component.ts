import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatAnchor, MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { FooterComponent, FooterLinkDirective } from '@app-speed/ui/footer';
import { AnalyticsConsentService } from '../analytics/analytics-consent.service';
import { operator } from '../legal/operator';

@Component({
  selector: 'app-site-footer',
  imports: [FooterComponent, FooterLinkDirective, MatAnchor, MatButton, RouterLink],
  template: `
    <ui-footer navigationLabel="Legal">
      <a uiFooterLink matButton routerLink="/legal-notice">Legal notice</a>
      <a uiFooterLink matButton routerLink="/privacy">Privacy policy</a>
      <a uiFooterLink matButton routerLink="/terms">Terms of service</a>
      <button uiFooterLink matButton type="button" (click)="consent.settingsOpen.set(true)">Cookie settings</button>
      <a uiFooterLink matButton [href]="'mailto:' + email">Contact</a>
      <span>
        Made with ❤️ by
        <a class="credit" target="_blank" rel="noopener noreferrer" href="https://x.com/chrispholder">Chris</a>
      </span>
    </ui-footer>
  `,
  styles: `
    .credit {
      color: inherit;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooterComponent {
  protected readonly consent = inject(AnalyticsConsentService);
  protected readonly email = operator.email;
}
