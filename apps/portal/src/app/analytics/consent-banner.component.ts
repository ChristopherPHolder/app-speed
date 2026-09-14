import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { AnalyticsConsentService } from './analytics-consent.service';

@Component({
  selector: 'app-consent-banner',
  imports: [MatButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (consent.settingsOpen()) {
      <section aria-labelledby="consent-title" class="consent-banner">
        <h2 id="consent-title">A little insight helps.</h2>
        <p class="description">
          Allow Google Analytics cookies to help us improve App Speed? It’s optional. No advertising.
        </p>
        <details>
          <summary>Privacy details</summary>
          <p>
            Google receives usage and device information and processes your IP address to derive approximate location.
            Our page views exclude query strings and audit IDs. Analytics cookies distinguish visits for up to 180 days.
            Analytics stays off until you accept. Your choice is saved on this device for 180 days. Change it anytime in
            Cookie settings. Rejecting keeps the app available. Withdrawing consent removes these cookies and reloads
            the page.
            <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
              How Google uses information
            </a>
          </p>
        </details>
        <div class="actions">
          <button class="reject" mat-stroked-button type="button" (click)="consent.choose('rejected')">
            Reject analytics
          </button>
          <button mat-flat-button type="button" (click)="consent.choose('accepted')">Accept analytics</button>
        </div>
        @if (consent.choice() !== null) {
          <button class="close" mat-button type="button" (click)="consent.settingsOpen.set(false)">
            Close settings
          </button>
        }
      </section>
    }
    <div class="settings">
      <button mat-button type="button" (click)="consent.settingsOpen.set(true)">Cookie settings</button>
    </div>
  `,
  styles: `
    .consent-banner {
      position: fixed;
      inset: auto auto 20px 20px;
      z-index: 100;
      box-sizing: border-box;
      width: min(400px, calc(100% - 40px));
      max-height: calc(100dvh - 40px);
      overflow: auto;
      padding: 20px;
      border: 1px solid var(--mat-sys-outline-variant, #dfe3eb);
      border-radius: 16px;
      background: var(--mat-sys-surface, #fff);
      color: var(--mat-sys-on-surface, #1f1f1f);
      box-shadow: 0 4px 24px #18274414;
    }
    h2 {
      margin: 0;
      font-size: 1rem;
      line-height: 1.5;
      font-weight: 600;
      letter-spacing: -0.015em;
    }
    p {
      margin: 8px 0 12px;
      color: var(--mat-sys-on-surface-variant, #444746);
      font-size: 0.875rem;
      line-height: 1.5;
    }
    a {
      color: var(--mat-sys-primary, #0b57d0);
    }
    summary {
      width: fit-content;
      color: var(--mat-sys-on-surface-variant, #444746);
      font-size: 0.75rem;
      line-height: 1.5;
      cursor: pointer;
    }
    summary:focus-visible {
      outline: 2px solid var(--mat-sys-primary, #0b57d0);
      outline-offset: 4px;
      border-radius: 2px;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
    }
    .actions > button {
      flex: 1 1 140px;
      min-height: 40px;
    }
    .actions > .reject {
      color: var(--mat-sys-on-surface-variant, #444746);
      border-color: var(--mat-sys-outline, #74777f);
    }
    .close {
      display: block;
      margin: 8px auto -8px;
    }
    .settings {
      padding: 8px;
      text-align: center;
    }
    @media (max-width: 480px) {
      .consent-banner {
        inset: auto 12px 12px;
        width: auto;
        max-height: calc(100dvh - 24px);
        padding: 16px;
      }
    }
  `,
})
export class ConsentBannerComponent {
  protected readonly consent = inject(AnalyticsConsentService);
}
