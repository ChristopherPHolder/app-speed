import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'lib-trace-tools-catalog-page',
  imports: [MatAnchor, MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle, MatIcon, RouterLink],
  template: `
    <main class="catalog" aria-labelledby="trace-tools-title">
      <a mat-button routerLink="/convenience"><mat-icon aria-hidden="true">arrow_back</mat-icon>All tools</a>
      <header>
        <p>Chrome performance traces</p>
        <h1 id="trace-tools-title">Trace tools</h1>
        <span>Everything runs locally in your browser.</span>
      </header>
      <section aria-label="Available trace tools">
        <mat-card appearance="outlined">
          <mat-card-header
            ><mat-icon mat-card-avatar aria-hidden="true">photo_library</mat-icon
            ><mat-card-title>Screenshots</mat-card-title></mat-card-header
          >
          <mat-card-content
            ><p>Extract every captured frame with deterministic filenames and timing metadata.</p></mat-card-content
          >
          <mat-card-actions
            ><a mat-flat-button routerLink="/convenience/trace/screenshots">Open Screenshots</a></mat-card-actions
          >
        </mat-card>
        <mat-card appearance="outlined">
          <mat-card-header
            ><mat-icon mat-card-avatar aria-hidden="true">view_carousel</mat-icon
            ><mat-card-title>Filmstrip</mat-card-title></mat-card-header
          >
          <mat-card-content
            ><p>Filter, inspect, and export the visual timeline as one horizontal PNG.</p></mat-card-content
          >
          <mat-card-actions
            ><a mat-flat-button routerLink="/convenience/trace/filmstrip">Open Filmstrip</a></mat-card-actions
          >
        </mat-card>
      </section>
    </main>
  `,
  styles: `
    .catalog {
      width: min(100% - 48px, 1000px);
      margin: 32px auto 64px;
    }
    header {
      margin: 32px 0;
      padding: 32px;
      border-radius: 24px;
      background: var(--mat-sys-surface-container-low);
    }
    header p {
      margin: 0;
      color: var(--mat-sys-primary);
      font: var(--mat-sys-label-large);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    h1 {
      margin: 6px 0;
      font: var(--mat-sys-display-small);
    }
    header span,
    mat-card-content {
      color: var(--mat-sys-on-surface-variant);
    }
    section {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
    }
    mat-icon[mat-card-avatar] {
      display: grid;
      border-radius: 12px;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      place-items: center;
    }
    mat-card-actions {
      justify-content: flex-end;
    }
    @media (max-width: 680px) {
      .catalog {
        width: min(100% - 28px, 1000px);
      }
      section {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraceToolsCatalogPageComponent {}
