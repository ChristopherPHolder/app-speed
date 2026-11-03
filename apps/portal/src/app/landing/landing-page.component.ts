import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  imports: [MatAnchor, MatIcon, RouterLink],
  template: `
    <div class="landing">
      <section class="hero" aria-labelledby="landing-title">
        <p class="eyebrow">Web performance toolkit</p>
        <h1 id="landing-title">Measure, understand, and improve app speed</h1>
        <p class="hero__description">
          Run repeatable user-flow audits, follow results over time, and turn browser traces into useful visuals.
        </p>
        <div class="hero__actions">
          <a mat-flat-button routerLink="/audits/user-flow">
            Run a user-flow audit
            <mat-icon aria-hidden="true">arrow_forward</mat-icon>
          </a>
          <a mat-stroked-button routerLink="/audits/history">View audit history</a>
        </div>
      </section>

      <section class="features" aria-labelledby="features-title">
        <header>
          <p class="eyebrow">Get started</p>
          <h2 id="features-title">Choose a workflow</h2>
        </header>

        <div class="feature-grid">
          <a class="feature-card" routerLink="/audits/user-flow">
            <span class="feature-card__icon"><mat-icon aria-hidden="true">speed</mat-icon></span>
            <span class="feature-card__content">
              <strong>Run an audit</strong>
              <span>Measure a complete user journey with a repeatable sequence of browser steps.</span>
            </span>
            <span class="feature-card__action">Create audit <mat-icon aria-hidden="true">arrow_forward</mat-icon></span>
          </a>

          <a class="feature-card" routerLink="/audits/history">
            <span class="feature-card__icon"><mat-icon aria-hidden="true">history</mat-icon></span>
            <span class="feature-card__content">
              <strong>Review history</strong>
              <span>Track scheduled, running, and completed audits from one place.</span>
            </span>
            <span class="feature-card__action">View history <mat-icon aria-hidden="true">arrow_forward</mat-icon></span>
          </a>

          <a class="feature-card" routerLink="/convenience">
            <span class="feature-card__icon"><mat-icon aria-hidden="true">construction</mat-icon></span>
            <span class="feature-card__content">
              <strong>Use trace tools</strong>
              <span>Extract screenshots and build filmstrips from Chrome traces locally.</span>
            </span>
            <span class="feature-card__action"
              >Explore tools <mat-icon aria-hidden="true">arrow_forward</mat-icon></span
            >
          </a>
        </div>
      </section>
    </div>
  `,
  styles: `
    .landing {
      --landing-typeface: Roboto, 'Helvetica Neue', sans-serif;
      width: min(100% - 32px, 1120px);
      margin: 16px auto 48px;
    }
    .hero {
      padding: 24px;
      border: 1px solid var(--mat-sys-outline-variant, #c4c7c5);
      border-radius: 28px;
      background: var(--mat-sys-surface-container-low, #f8f9ff);
    }
    .eyebrow {
      margin: 0 0 8px;
      color: var(--mat-sys-primary, #0b57d0);
      font: var(--mat-sys-label-large, 500 0.875rem/1.25rem var(--landing-typeface));
    }
    h1 {
      max-width: 760px;
      margin: 0;
      font: var(--mat-sys-headline-large, 400 2rem/2.5rem var(--landing-typeface));
      text-wrap: balance;
    }
    .hero__description {
      max-width: 680px;
      margin: 16px 0 0;
      color: var(--mat-sys-on-surface-variant, #444746);
      font: var(--mat-sys-body-large, 400 1rem/1.5rem var(--landing-typeface));
    }
    .hero__actions {
      display: flex;
      margin-top: 24px;
      align-items: stretch;
      flex-direction: column;
      gap: 12px;
    }
    .feature-card:focus-visible {
      outline: 3px solid var(--mat-sys-primary, #0b57d0);
      outline-offset: 3px;
    }
    .features {
      margin-top: 32px;
    }
    h2 {
      margin: 0 0 16px;
      font: var(--mat-sys-headline-small, 400 1.5rem/2rem var(--landing-typeface));
    }
    .feature-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 16px;
    }
    .feature-card {
      display: grid;
      padding: 16px;
      border: 1px solid var(--mat-sys-outline-variant, #c4c7c5);
      border-radius: 24px;
      background: var(--mat-sys-surface, #ffffff);
      color: var(--mat-sys-on-surface, #1f1f1f);
      text-decoration: none;
      grid-template-rows: auto 1fr auto;
    }
    .feature-card__icon {
      display: grid;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      border-radius: 16px;
      background: var(--mat-sys-primary-container, #d7e3ff);
      color: var(--mat-sys-on-primary-container, #001b3f);
      place-items: center;
    }
    .feature-card__content {
      display: grid;
      align-content: start;
      gap: 8px;
    }
    .feature-card__content strong {
      font: var(--mat-sys-title-large, 400 1.375rem/1.75rem var(--landing-typeface));
    }
    .feature-card__content > span {
      color: var(--mat-sys-on-surface-variant, #444746);
      font: var(--mat-sys-body-medium, 400 0.875rem/1.25rem var(--landing-typeface));
    }
    .feature-card__action {
      display: flex;
      margin-top: 16px;
      align-items: center;
      gap: 8px;
      font: var(--mat-sys-label-large, 500 0.875rem/1.25rem var(--landing-typeface));
      color: var(--mat-sys-primary, #0b57d0);
    }
    @media (min-width: 600px) {
      .landing {
        width: min(100% - 48px, 1120px);
        margin-block: 24px 64px;
      }
      .hero {
        padding: 32px;
      }
      h1 {
        font: var(--mat-sys-display-small, 400 2.25rem/2.75rem var(--landing-typeface));
      }
      .hero__actions {
        align-items: center;
        flex-direction: row;
        flex-wrap: wrap;
      }
      .feature-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .feature-card {
        padding: 24px;
      }
    }
    @media (min-width: 840px) {
      .hero {
        padding: 48px;
      }
      h1 {
        font: var(--mat-sys-display-medium, 400 2.8125rem/3.25rem var(--landing-typeface));
      }
      .features {
        margin-top: 48px;
      }
      .feature-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 24px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent {}
