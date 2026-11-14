import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnalyticsConsentService } from '../analytics/analytics-consent.service';
import { operator } from '../legal/operator';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  template: `
    <footer>
      <nav aria-label="Legal">
        <ul>
          <li><a routerLink="/legal-notice">Legal notice</a></li>
          <li><a routerLink="/privacy">Privacy policy</a></li>
          <li><a routerLink="/terms">Terms of service</a></li>
          <li>
            <button type="button" (click)="consent.settingsOpen.set(true)">Cookie settings</button>
          </li>
          <li><a [href]="'mailto:' + email">Contact</a></li>
        </ul>
      </nav>
      <p>
        Made with ❤️ by
        <a target="_blank" rel="noopener noreferrer" href="https://x.com/chrispholder">Chris</a>
      </p>
    </footer>
  `,
  styles: `
    footer {
      display: grid;
      justify-items: center;
      gap: var(--ui-space-2);
      padding: var(--ui-space-4) var(--ui-page-gutter);
      border-top: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-low);
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
    ul {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0 var(--ui-space-4);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li > a,
    li > button {
      display: inline-flex;
      align-items: center;
      min-height: var(--ui-target-size);
    }
    a,
    button {
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      text-decoration: underline;
      text-underline-offset: 0.2em;
      cursor: pointer;
    }
    a:hover,
    button:hover {
      color: var(--mat-sys-on-surface);
    }
    a:focus-visible,
    button:focus-visible {
      outline: 2px solid var(--mat-sys-primary);
      outline-offset: 2px;
      border-radius: var(--mat-sys-corner-extra-small);
    }
    p {
      margin: 0 0 var(--ui-space-2);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooterComponent {
  protected readonly consent = inject(AnalyticsConsentService);
  protected readonly email = operator.email;
}
