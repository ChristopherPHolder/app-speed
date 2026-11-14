import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  inject,
  untracked,
  viewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { AnalyticsConsentService } from './analytics-consent.service';

@Component({
  selector: 'app-consent-banner',
  imports: [MatButton, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (consent.settingsOpen()) {
      <section #panel aria-labelledby="consent-title" class="consent-banner" tabindex="-1">
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
          <p><a routerLink="/privacy">Read the privacy policy</a></p>
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
  `,
  styles: `
    /* A non-modal surface that floats over the page until a choice is made. */
    .consent-banner {
      position: fixed;
      inset: auto auto var(--ui-space-4) var(--ui-space-4);
      z-index: 100;
      box-sizing: border-box;
      width: min(400px, calc(100% - 2 * var(--ui-space-4)));
      max-height: calc(100dvh - 2 * var(--ui-space-4));
      overflow: auto;
      padding: var(--ui-space-5);
      border-radius: var(--mat-sys-corner-large);
      background: var(--mat-sys-surface-container-high);
      color: var(--mat-sys-on-surface);
      box-shadow: var(--mat-sys-level3);
    }
    h2 {
      margin: 0;
      font: var(--mat-sys-title-medium);
    }
    p {
      margin: var(--ui-space-2) 0 var(--ui-space-3);
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }
    a {
      color: var(--mat-sys-primary);
    }
    summary {
      width: fit-content;
      border-radius: var(--mat-sys-corner-extra-small);
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-large);
      cursor: pointer;
    }
    .consent-banner:focus {
      outline: none;
    }
    summary:focus-visible {
      outline: 2px solid var(--mat-sys-primary);
      outline-offset: 2px;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ui-space-2);
      margin-top: var(--ui-space-4);
    }
    .actions > button {
      flex: 1 1 140px;
    }
    .close {
      display: block;
      margin: var(--ui-space-2) auto calc(-1 * var(--ui-space-2));
    }
    @media (width < 600px) {
      /* In compact windows it docks to the bottom edge like a sheet. */
      .consent-banner {
        inset: auto 0 0;
        width: auto;
        max-height: calc(100dvh - 64px);
        padding: var(--ui-space-4);
        border-radius: var(--mat-sys-corner-extra-large) var(--mat-sys-corner-extra-large) 0 0;
      }
    }
  `,
})
export class ConsentBannerComponent {
  protected readonly consent = inject(AnalyticsConsentService);
  private readonly document = inject(DOCUMENT);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private returnFocus: HTMLElement | null = null;

  constructor() {
    // Reopened settings take focus, and give it back when closed; the first-visit banner doesn't steal focus.
    afterRenderEffect(() => {
      const panel = this.panel()?.nativeElement;
      if (panel && untracked(this.consent.choice) !== null) {
        const active = this.document.activeElement;
        this.returnFocus = active instanceof HTMLElement ? active : null;
        panel.focus();
      } else if (!panel && this.returnFocus) {
        this.returnFocus.focus();
        this.returnFocus = null;
      }
    });
  }
}
