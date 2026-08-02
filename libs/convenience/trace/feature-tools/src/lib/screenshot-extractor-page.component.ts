import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { TraceDropZoneComponent, TraceScreenshotPreviewComponent } from '@app-speed/convenience/trace/portal-ui';
import {
  buildScreenshotArchive,
  downloadScreenshotArchive,
  type ScreenshotArchive,
} from '@app-speed/convenience/trace/portal-data-access';
import { Effect } from 'effect';

type ExtractionState =
  | { readonly status: 'idle' }
  | { readonly status: 'processing'; readonly fileName: string }
  | { readonly status: 'ready'; readonly fileName: string; readonly archive: ScreenshotArchive }
  | { readonly status: 'error'; readonly fileName: string; readonly message: string };

@Component({
  selector: 'lib-screenshot-extractor-page',
  imports: [
    MatAnchor,
    MatButton,
    MatCard,
    MatCardContent,
    MatIcon,
    MatProgressSpinner,
    RouterLink,
    TraceDropZoneComponent,
    TraceScreenshotPreviewComponent,
  ],
  template: `
    <main class="extractor" aria-labelledby="page-title">
      <a mat-button routerLink="/convenience"><mat-icon aria-hidden="true">arrow_back</mat-icon>All tools</a>
      @if (state(); as current) {
        @switch (current.status) {
          @case ('processing') {
            <mat-card appearance="outlined"
              ><mat-card-content class="result result--processing">
                <mat-spinner diameter="44" />
                <div>
                  <h2>Reading trace</h2>
                  <p>{{ current.fileName }}</p>
                </div>
              </mat-card-content></mat-card
            >
          }
          @case ('ready') {
            <mat-card appearance="outlined"
              ><mat-card-content class="result">
                <div class="result__icon result__icon--success"><mat-icon aria-hidden="true">check</mat-icon></div>
                <div class="result__copy">
                  <h2>{{ current.archive.frameCount }} screenshots are ready</h2>
                  <p>{{ current.fileName }} · ZIP includes the images and timings.json</p>
                </div>
                <button mat-flat-button type="button" (click)="download(current.archive)">
                  <mat-icon aria-hidden="true">download</mat-icon>Download ZIP
                </button>
              </mat-card-content></mat-card
            >
            <lib-trace-screenshot-preview [frames]="current.archive.previewFrames" />
          }
          @case ('error') {
            <mat-card appearance="outlined" class="error-card"
              ><mat-card-content class="result">
                <div class="result__icon result__icon--error"><mat-icon aria-hidden="true">error</mat-icon></div>
                <div class="result__copy">
                  <h2>Couldn’t extract screenshots</h2>
                  <p>{{ current.message }}</p>
                </div>
                <button mat-stroked-button type="button" (click)="reset()">Try another trace</button>
              </mat-card-content></mat-card
            >
          }
          @default {
            <lib-trace-drop-zone (fileSelected)="extract($event)" />
          }
        }
      }
    </main>
  `,
  styles: `
    :host {
      display: block;
    }
    .extractor {
      width: min(100% - 48px, 920px);
      margin: 32px auto 64px;
    }
    header {
      display: flex;
      margin: 28px 0 36px;
      align-items: center;
      gap: 22px;
    }
    .header__icon {
      display: grid;
      width: 68px;
      height: 68px;
      flex: 0 0 auto;
      border-radius: 20px;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      place-items: center;
    }
    .header__icon mat-icon {
      width: 34px;
      height: 34px;
      font-size: 34px;
    }
    .eyebrow {
      margin: 0 0 3px;
      color: var(--mat-sys-primary);
      font: var(--mat-sys-label-large);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    h1 {
      margin: 0;
      font: var(--mat-sys-display-small);
      letter-spacing: -0.02em;
    }
    header p:last-child {
      margin: 7px 0 0;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-large);
    }
    .result {
      display: flex;
      min-height: 110px;
      padding: 24px 28px;
      align-items: center;
      gap: 20px;
    }
    lib-trace-screenshot-preview + mat-card {
      display: block;
      margin-top: 18px;
    }
    .result--processing {
      justify-content: center;
    }
    .result__icon {
      display: grid;
      width: 52px;
      height: 52px;
      flex: 0 0 auto;
      border-radius: 50%;
      place-items: center;
    }
    .result__icon--success {
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
    }
    .result__icon--error {
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
    }
    .result__copy {
      flex: 1;
    }
    h2 {
      margin: 0 0 5px;
      font: var(--mat-sys-title-large);
    }
    .result p {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
    }
    .another {
      margin-top: 12px;
    }
    aside {
      display: flex;
      margin-top: 28px;
      padding: 18px 22px;
      align-items: center;
      gap: 14px;
      border-radius: 16px;
      background: var(--mat-sys-surface-container);
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }
    aside mat-icon {
      color: var(--mat-sys-primary);
    }
    @media (max-width: 680px) {
      .extractor {
        width: min(100% - 28px, 920px);
      }
      header {
        align-items: flex-start;
      }
      .result {
        align-items: flex-start;
        flex-wrap: wrap;
      }
      .result__copy {
        min-width: calc(100% - 76px);
      }
      .result button {
        width: 100%;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScreenshotExtractorPageComponent {
  protected readonly state = signal<ExtractionState>({ status: 'idle' });

  protected extract(file: File): void {
    this.state.set({ status: 'processing', fileName: file.name });
    void Effect.runPromise(
      Effect.match(buildScreenshotArchive(file), {
        onFailure: (error): ExtractionState => ({ status: 'error', fileName: file.name, message: error.message }),
        onSuccess: (archive): ExtractionState => ({ status: 'ready', fileName: file.name, archive }),
      }),
    ).then((state) => this.state.set(state));
  }

  protected download(archive: ScreenshotArchive): void {
    downloadScreenshotArchive(archive);
  }
  protected reset(): void {
    this.state.set({ status: 'idle' });
  }
}
