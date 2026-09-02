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
            <span class="feature-card__action">Explore tools <mat-icon aria-hidden="true">arrow_forward</mat-icon></span>
          </a>
        </div>
      </section>
    </div>
  `,
  styles: `
    .landing {
      width: min(100% - 48px, 1120px);
      margin: 28px auto 64px;
    }
    .hero {
      padding: 56px;
      border: 1px solid var(--mat-sys-outline-variant, #c4c7c5);
      border-radius: 28px;
      background: var(--mat-sys-surface-container-low, #f8f9ff);
    }
    .eyebrow {
      margin: 0 0 8px;
      color: var(--mat-sys-primary, #0b57d0);
      font-weight: 600;
      text-transform: uppercase;
    }
    h1 {
      max-width: 760px;
      margin: 0;
      font-size: 3rem;
      line-height: 1.08;
      letter-spacing: -0.035em;
    }
    .hero__description {
      max-width: 680px;
      margin: 20px 0 0;
      color: var(--mat-sys-on-surface-variant, #444746);
      font-size: 1.125rem;
      line-height: 1.6;
    }
    .hero__actions {
      display: flex;
      margin-top: 28px;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .feature-card:focus-visible {
      outline: 3px solid var(--mat-sys-primary, #0b57d0);
      outline-offset: 3px;
    }
    .features {
      margin-top: 44px;
    }
    h2 {
      margin: 0 0 20px;
    }
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
    }
    .feature-card {
      display: grid;
      min-height: 230px;
      padding: 26px;
      border: 1px solid var(--mat-sys-outline-variant, #c4c7c5);
      border-radius: 22px;
      background: var(--mat-sys-surface, #ffffff);
      color: var(--mat-sys-on-surface, #1f1f1f);
      text-decoration: none;
      grid-template-rows: auto 1fr auto;
    }
    .feature-card__icon {
      display: grid;
      width: 52px;
      height: 52px;
      margin-bottom: 22px;
      border-radius: 16px;
      background: var(--mat-sys-primary-container, #d7e3ff);
      color: var(--mat-sys-on-primary-container, #001b3f);
      place-items: center;
    }
    .feature-card__content {
      display: grid;
      align-content: start;
      gap: 9px;
    }
    .feature-card__content strong {
      font-size: 1.25rem;
    }
    .feature-card__content > span {
      color: var(--mat-sys-on-surface-variant, #444746);
      line-height: 1.45;
    }
    .feature-card__action {
      display: flex;
      margin-top: 24px;
      align-items: center;
      gap: 6px;
      color: var(--mat-sys-primary, #0b57d0);
    }
    @media (max-width: 800px) {
      .hero {
        padding: 48px 36px;
      }
      h1 {
        font-size: 2.5rem;
      }
      .feature-grid {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 520px) {
      .landing {
        width: min(100% - 28px, 1120px);
        margin-top: 14px;
      }
      .hero {
        padding: 36px 24px;
      }
      h1 {
        font-size: 2.1rem;
      }
      .hero__actions {
        align-items: stretch;
        flex-direction: column;
      }
      .hero__actions a {
        text-align: center;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent {}
