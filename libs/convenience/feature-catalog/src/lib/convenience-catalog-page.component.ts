import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  MatCard,
  MatCardAvatar,
  MatCardContent,
  MatCardHeader,
  MatCardSubtitle,
  MatCardTitle,
} from '@angular/material/card';
import { MatChip, MatChipSet } from '@angular/material/chips';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatList, MatListItem, MatListItemIcon, MatListItemLine, MatListItemTitle } from '@angular/material/list';

@Component({
  selector: 'lib-convenience-catalog-page',
  imports: [
    MatCard,
    MatCardAvatar,
    MatCardContent,
    MatCardHeader,
    MatCardSubtitle,
    MatCardTitle,
    MatChip,
    MatChipSet,
    MatDivider,
    MatIcon,
    MatList,
    MatListItem,
    MatListItemIcon,
    MatListItemLine,
    MatListItemTitle,
  ],
  template: `
    <main class="catalog" aria-labelledby="catalog-title">
      <section class="hero">
        <div class="hero__content">
          <div class="hero__label">
            <mat-icon aria-hidden="true">handyman</mat-icon>
            <span>Developer utilities</span>
          </div>
          <h1 id="catalog-title">Convenience tools</h1>
          <p>Turn performance artifacts into useful visuals without leaving App Speed.</p>
        </div>

        <div class="hero__visual" aria-hidden="true">
          <mat-icon>speed</mat-icon>
          <mat-icon>arrow_forward</mat-icon>
          <mat-icon>auto_awesome</mat-icon>
        </div>
      </section>

      <section class="tools" aria-labelledby="categories-title">
        <header class="tools__header">
          <div>
            <p class="tools__eyebrow">Browse by category</p>
            <h2 id="categories-title">Choose what you want to work with</h2>
          </div>
          <span class="tools__count">1 category</span>
        </header>

        <mat-card class="category-card" appearance="outlined">
          <div class="category-card__accent" aria-hidden="true"></div>
          <mat-card-header>
            <div mat-card-avatar class="category-card__avatar">
              <mat-icon aria-hidden="true">monitoring</mat-icon>
            </div>
            <mat-card-title>Trace tools</mat-card-title>
            <mat-card-subtitle>Chrome performance traces</mat-card-subtitle>
            <span class="category-card__status">Coming next</span>
          </mat-card-header>

          <mat-card-content>
            <p class="category-card__description">
              Upload a trace once, then extract frames or turn its visual timeline into shareable assets.
            </p>

            <mat-divider />

            <mat-list aria-label="Trace tools">
              <mat-list-item>
                <mat-icon matListItemIcon aria-hidden="true">photo_library</mat-icon>
                <span matListItemTitle>Screenshots</span>
                <span matListItemLine>Extract and download captured frames</span>
              </mat-list-item>
              <mat-list-item>
                <mat-icon matListItemIcon aria-hidden="true">view_carousel</mat-icon>
                <span matListItemTitle>Filmstrips</span>
                <span matListItemLine>Generate or compare visual timelines</span>
              </mat-list-item>
              <mat-list-item>
                <mat-icon matListItemIcon aria-hidden="true">gif_box</mat-icon>
                <span matListItemTitle>GIFs</span>
                <span matListItemLine>Create animated exports and comparisons</span>
              </mat-list-item>
            </mat-list>

            <mat-chip-set aria-label="Trace tool characteristics">
              <mat-chip>Runs locally</mat-chip>
              <mat-chip>No upload required</mat-chip>
            </mat-chip-set>
          </mat-card-content>
        </mat-card>
      </section>
    </main>
  `,
  styles: `
    :host {
      display: block;
    }

    .catalog {
      width: min(100% - 48px, 1120px);
      margin: 40px auto 64px;
    }

    .hero {
      position: relative;
      display: flex;
      min-height: 260px;
      padding: 48px;
      overflow: hidden;
      align-items: center;
      justify-content: space-between;
      border-radius: 28px;
      background:
        radial-gradient(
          circle at 85% 15%,
          color-mix(in srgb, var(--mat-sys-primary, #005cbb) 24%, transparent),
          transparent 38%
        ),
        var(--mat-sys-surface-container, #eef3ff);
    }

    .hero__content {
      position: relative;
      z-index: 1;
      max-width: 650px;
    }

    .hero__label {
      display: inline-flex;
      margin-bottom: 20px;
      padding: 8px 14px;
      align-items: center;
      gap: 8px;
      border-radius: 999px;
      background: var(--mat-sys-primary-container, #d7e3ff);
      color: var(--mat-sys-on-primary-container, #001b3f);
      font: var(--mat-sys-label-large, 500 0.875rem/1.25rem Roboto, sans-serif);
    }

    .hero__label mat-icon {
      width: 20px;
      height: 20px;
      font-size: 20px;
    }

    .hero h1 {
      margin: 0 0 16px;
      color: var(--mat-sys-on-surface, #1a1b1f);
      font: var(--mat-sys-display-medium, 700 3rem/1.08 Roboto, sans-serif);
      letter-spacing: -0.03em;
    }

    .hero p {
      max-width: 560px;
      margin: 0;
      color: var(--mat-sys-on-surface-variant, #44474e);
      font: var(--mat-sys-body-large, 400 1.125rem/1.65rem Roboto, sans-serif);
    }

    .hero__visual {
      display: grid;
      grid-template-columns: auto auto auto;
      align-items: center;
      gap: 16px;
      color: var(--mat-sys-primary, #005cbb);
    }

    .hero__visual mat-icon:first-child,
    .hero__visual mat-icon:last-child {
      display: grid;
      width: 72px;
      height: 72px;
      border-radius: 24px;
      background: var(--mat-sys-primary-container, #d7e3ff);
      font-size: 38px;
      place-items: center;
    }

    .hero__visual mat-icon:nth-child(2) {
      color: var(--mat-sys-outline, #74777f);
    }

    .tools {
      margin-top: 48px;
    }

    .tools__header {
      display: flex;
      margin-bottom: 24px;
      align-items: end;
      justify-content: space-between;
      gap: 24px;
    }

    .tools__eyebrow {
      margin: 0 0 6px;
      color: var(--mat-sys-primary, #005cbb);
      font: var(--mat-sys-label-large, 500 0.875rem/1.25rem Roboto, sans-serif);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h2 {
      margin: 0;
      color: var(--mat-sys-on-surface, #1a1b1f);
      font: var(--mat-sys-headline-medium, 500 1.75rem/2.25rem Roboto, sans-serif);
    }

    .tools__count {
      flex: 0 0 auto;
      padding: 7px 12px;
      border-radius: 999px;
      background: var(--mat-sys-secondary-container, #dce2f9);
      color: var(--mat-sys-on-secondary-container, #131c2b);
      font: var(--mat-sys-label-medium, 500 0.75rem/1rem Roboto, sans-serif);
    }

    .category-card {
      position: relative;
      max-width: 760px;
      overflow: hidden;
      border-color: var(--mat-sys-outline-variant, #c4c6d0);
    }

    .category-card__accent {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 6px;
      background: var(--mat-sys-primary, #005cbb);
    }

    .category-card mat-card-header {
      position: relative;
      padding: 24px 24px 20px 30px;
    }

    .category-card__avatar {
      display: grid;
      background: var(--mat-sys-primary-container, #d7e3ff);
      color: var(--mat-sys-on-primary-container, #001b3f);
      place-items: center;
    }

    .category-card__status {
      position: absolute;
      top: 24px;
      right: 24px;
      padding: 7px 12px;
      border-radius: 999px;
      background: var(--mat-sys-tertiary-container, #eaddff);
      color: var(--mat-sys-on-tertiary-container, #21005d);
      font: var(--mat-sys-label-medium, 500 0.75rem/1rem Roboto, sans-serif);
      white-space: nowrap;
    }

    .category-card mat-card-content {
      padding: 0 24px 24px 30px;
    }

    .category-card__description {
      max-width: 600px;
      margin: 0 0 24px;
      color: var(--mat-sys-on-surface-variant, #44474e);
      font: var(--mat-sys-body-medium, 400 1rem/1.5rem Roboto, sans-serif);
    }

    mat-list {
      padding: 12px 0;
    }

    mat-list-item mat-icon {
      color: var(--mat-sys-primary, #005cbb);
    }

    mat-chip-set {
      display: block;
      margin-top: 8px;
    }

    @media (max-width: 720px) {
      .catalog {
        width: min(100% - 24px, 1120px);
        margin: 24px auto 48px;
      }

      .hero {
        min-height: auto;
        padding: 32px 24px;
      }

      .hero h1 {
        font: var(--mat-sys-display-small, 700 2.25rem/2.5rem Roboto, sans-serif);
      }

      .hero__visual {
        display: none;
      }

      .tools {
        margin-top: 36px;
      }

      .tools__header {
        align-items: start;
      }

      .tools__count {
        display: none;
      }

      .category-card mat-card-header {
        padding: 20px 116px 16px 26px;
      }

      .category-card mat-card-content {
        padding: 0 20px 20px 26px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConvenienceCatalogPageComponent {}
