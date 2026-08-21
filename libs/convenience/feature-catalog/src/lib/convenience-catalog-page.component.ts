import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'lib-convenience-catalog-page',
  imports: [MatIcon, RouterLink],
  template: `
    <main class="catalog" aria-labelledby="catalog-title">
      <section class="hero">
        <div class="hero__content">
          <p class="eyebrow">Local trace utilities</p>
          <h1 id="catalog-title">Turn a Chrome trace into useful visuals</h1>
          <p class="hero__description">
            Extract every captured screenshot or build a presentation-ready filmstrip directly in your browser.
          </p>
          <p class="privacy-note">
            <mat-icon aria-hidden="true">verified_user</mat-icon>
            Your trace stays on this device. Nothing is uploaded.
          </p>
        </div>

        <ol class="workflow" aria-label="How trace tools work">
          <li>
            <mat-icon aria-hidden="true">upload_file</mat-icon>
            <span><strong>Drop a trace</strong><small>.json or .trace</small></span>
          </li>
          <li aria-hidden="true" class="workflow__arrow"><mat-icon>arrow_forward</mat-icon></li>
          <li>
            <mat-icon aria-hidden="true">touch_app</mat-icon>
            <span><strong>Choose a workflow</strong><small>Screenshots or filmstrip</small></span>
          </li>
          <li aria-hidden="true" class="workflow__arrow"><mat-icon>arrow_forward</mat-icon></li>
          <li>
            <mat-icon aria-hidden="true">download</mat-icon>
            <span><strong>Export locally</strong><small>ZIP or PNG</small></span>
          </li>
        </ol>
      </section>

      <section class="tools" aria-labelledby="tools-title">
        <header>
          <p class="eyebrow">Trace tools</p>
          <h2 id="tools-title">What do you want to create?</h2>
        </header>

        <div class="tool-grid">
          <a class="tool-card" routerLink="/convenience/trace/screenshots">
            <span class="tool-card__icon"><mat-icon aria-hidden="true">photo_library</mat-icon></span>
            <span class="tool-card__content">
              <span class="tool-card__label">Captured frames</span>
              <strong>Extract screenshots</strong>
              <span>Preview every captured frame, then download the images and timing metadata in one ZIP.</span>
            </span>
            <span class="tool-card__action">
              Open screenshot extractor
              <mat-icon aria-hidden="true">arrow_forward</mat-icon>
            </span>
          </a>

          <a class="tool-card" routerLink="/convenience/trace/filmstrip">
            <span class="tool-card__icon"><mat-icon aria-hidden="true">view_carousel</mat-icon></span>
            <span class="tool-card__content">
              <span class="tool-card__label">Visual timeline</span>
              <strong>Build a filmstrip</strong>
              <span>Choose an interval or time range, inspect the frames, and export one horizontal PNG.</span>
            </span>
            <span class="tool-card__action">
              Open filmstrip builder
              <mat-icon aria-hidden="true">arrow_forward</mat-icon>
            </span>
          </a>
        </div>
      </section>
    </main>
  `,
  styles: `
    :host {
      display: block;
    }
    .catalog {
      width: min(100% - 48px, 1120px);
      margin: 28px auto 64px;
    }
    .hero {
      display: grid;
      padding: 36px 40px;
      border: 1px solid var(--mat-sys-outline-variant, #c4c7c5);
      border-radius: 28px;
      background: var(--mat-sys-surface-container-low, #f8f9ff);
      grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
      align-items: center;
      gap: 56px;
    }
    .eyebrow {
      margin: 0 0 8px;
      color: var(--mat-sys-primary, #0b57d0);
      font: var(--mat-sys-label-large, 600 0.75rem/1rem Roboto, sans-serif);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    h1 {
      max-width: 680px;
      margin: 0;
      color: var(--mat-sys-on-surface, #1f1f1f);
      font: var(--mat-sys-display-medium, 700 2.75rem/1.08 Roboto, sans-serif);
      letter-spacing: -0.035em;
    }
    .hero__description {
      max-width: 620px;
      margin: 20px 0 0;
      color: var(--mat-sys-on-surface-variant, #444746);
      font: var(--mat-sys-body-large, 400 1.125rem/1.65rem Roboto, sans-serif);
    }
    .privacy-note {
      display: flex;
      margin: 24px 0 0;
      align-items: center;
      gap: 8px;
      color: var(--mat-sys-on-surface-variant, #444746);
      font: var(--mat-sys-label-large, 500 0.875rem/1.25rem Roboto, sans-serif);
    }
    .privacy-note mat-icon,
    .workflow li > mat-icon {
      color: var(--mat-sys-primary, #0b57d0);
    }
    .workflow {
      display: grid;
      margin: 0;
      padding: 0;
      list-style: none;
      gap: 8px;
    }
    .workflow li:not(.workflow__arrow) {
      display: grid;
      min-height: 54px;
      padding: 10px 14px;
      border-radius: 16px;
      background: var(--mat-sys-surface, #ffffff);
      grid-template-columns: 36px 1fr;
      align-items: center;
      gap: 12px;
    }
    .workflow span {
      display: grid;
    }
    .workflow strong {
      font: var(--mat-sys-title-small, 600 0.875rem/1.25rem Roboto, sans-serif);
    }
    .workflow small {
      color: var(--mat-sys-on-surface-variant, #444746);
      font: var(--mat-sys-body-small, 400 0.75rem/1rem Roboto, sans-serif);
    }
    .workflow__arrow {
      display: grid;
      height: 12px;
      padding-left: 21px;
      place-items: center start;
    }
    .workflow__arrow mat-icon {
      width: 18px;
      height: 18px;
      color: var(--mat-sys-outline, #747775);
      font-size: 18px;
      transform: rotate(90deg);
    }
    .tools {
      margin-top: 36px;
    }
    .tools header {
      margin-bottom: 22px;
    }
    h2 {
      margin: 0;
      color: var(--mat-sys-on-surface, #1f1f1f);
      font: var(--mat-sys-headline-medium, 600 1.75rem/2.25rem Roboto, sans-serif);
    }
    .tool-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
    }
    .tool-card {
      display: grid;
      min-height: 230px;
      padding: 28px;
      border: 1px solid var(--mat-sys-outline-variant, #c4c7c5);
      border-radius: 22px;
      background: var(--mat-sys-surface, #ffffff);
      color: var(--mat-sys-on-surface, #1f1f1f);
      text-decoration: none;
      grid-template-columns: auto 1fr;
      grid-template-rows: 1fr auto;
      gap: 0 18px;
      transition:
        border-color 140ms ease,
        box-shadow 140ms ease,
        transform 140ms ease;
    }
    .tool-card:hover {
      border-color: var(--mat-sys-primary, #0b57d0);
      box-shadow: 0 8px 24px rgb(31 31 31 / 10%);
      transform: translateY(-2px);
    }
    .tool-card:focus-visible {
      border-color: var(--mat-sys-primary, #0b57d0);
      outline: 3px solid var(--mat-sys-primary, #0b57d0);
      outline-offset: 3px;
    }
    .tool-card__icon {
      display: grid;
      width: 52px;
      height: 52px;
      border-radius: 16px;
      background: var(--mat-sys-primary-container, #d7e3ff);
      color: var(--mat-sys-on-primary-container, #001b3f);
      place-items: center;
    }
    .tool-card__content {
      display: grid;
      align-content: start;
    }
    .tool-card__label {
      margin-bottom: 5px;
      color: var(--mat-sys-primary, #0b57d0);
      font: var(--mat-sys-label-medium, 600 0.75rem/1rem Roboto, sans-serif);
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .tool-card__content strong {
      margin-bottom: 10px;
      font: var(--mat-sys-headline-small, 600 1.5rem/2rem Roboto, sans-serif);
    }
    .tool-card__content > span:last-child {
      color: var(--mat-sys-on-surface-variant, #444746);
      font: var(--mat-sys-body-medium, 400 0.875rem/1.35rem Roboto, sans-serif);
    }
    .tool-card__action {
      display: flex;
      padding-top: 24px;
      align-items: center;
      justify-content: space-between;
      color: var(--mat-sys-primary, #0b57d0);
      font: var(--mat-sys-label-large, 600 0.875rem/1.25rem Roboto, sans-serif);
      grid-column: 1 / -1;
    }
    .tool-card__action mat-icon {
      transition: transform 140ms ease;
    }
    .tool-card:hover .tool-card__action mat-icon {
      transform: translateX(4px);
    }
    @media (max-width: 840px) {
      .hero {
        grid-template-columns: 1fr;
        gap: 32px;
      }
      .workflow {
        grid-template-columns: repeat(5, auto);
        align-items: center;
      }
      .workflow__arrow {
        width: 18px;
        height: auto;
        padding: 0;
      }
      .workflow__arrow mat-icon {
        transform: none;
      }
    }
    @media (max-width: 680px) {
      .catalog {
        width: min(100% - 28px, 1120px);
        margin: 24px auto 48px;
      }
      .hero {
        padding: 28px 22px;
        border-radius: 22px;
      }
      h1 {
        font: var(--mat-sys-display-small, 700 2.25rem/2.5rem Roboto, sans-serif);
      }
      .hero__description {
        margin-top: 16px;
        font: var(--mat-sys-body-large, 400 1rem/1.5rem Roboto, sans-serif);
      }
      .privacy-note {
        align-items: flex-start;
      }
      .workflow {
        grid-template-columns: 1fr;
      }
      .workflow__arrow {
        width: auto;
        height: 16px;
        padding-left: 21px;
      }
      .workflow__arrow mat-icon {
        transform: rotate(90deg);
      }
      .tools {
        margin-top: 36px;
      }
      .tool-grid {
        grid-template-columns: 1fr;
      }
      .tool-card {
        min-height: 0;
        padding: 22px;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .tool-card,
      .tool-card__action mat-icon {
        transition: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConvenienceCatalogPageComponent {}
