import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import {
  TraceDropZoneComponent,
  TraceFileDropDirective,
  TraceFileDropOverlayComponent,
  TraceScreenshotPreviewComponent,
} from '@app-speed/convenience/trace/portal-ui';
import {
  downloadScreenshotArchive,
  prepareScreenshotExtraction,
  type ScreenshotArchive,
} from '@app-speed/convenience/trace/portal-data-access';
import { createEffectOperation } from './effect-operation';

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
    TraceFileDropDirective,
    TraceFileDropOverlayComponent,
    TraceScreenshotPreviewComponent,
  ],
  template: `
    <main
      class="extractor"
      aria-labelledby="page-title"
      libTraceFileDrop
      #replacement="traceFileDrop"
      [libTraceFileDropEnabled]="extraction.state().status !== 'idle'"
      (fileDropped)="extract($event)"
    >
      <a mat-button routerLink="/convenience"><mat-icon aria-hidden="true">arrow_back</mat-icon>All tools</a>
      @if (extraction.state(); as current) {
        @if (replacement.active()) {
          <lib-trace-file-drop-overlay description="The new preview will appear automatically." />
        }
        @switch (current.status) {
          @case ('running') {
            <mat-card appearance="outlined"
              ><mat-card-content class="result result--processing">
                <mat-spinner diameter="44" />
                <div>
                  <h2>Reading trace</h2>
                  <p>{{ current.label }}</p>
                </div>
              </mat-card-content></mat-card
            >
          }
          @case ('success') {
            <mat-card appearance="outlined"
              ><mat-card-content class="result">
                <div class="result__icon result__icon--success"><mat-icon aria-hidden="true">check</mat-icon></div>
                <div class="result__copy">
                  <h2>
                    {{ current.value.capture.frames.length }} screenshot{{
                      current.value.capture.frames.length === 1 ? '' : 's'
                    }}
                    {{ current.value.capture.frames.length === 1 ? 'is' : 'are' }} ready
                  </h2>
                  <p>{{ current.value.capture.sourceFileName }} · ZIP includes the images and timings.json</p>
                </div>
                <button
                  mat-flat-button
                  type="button"
                  [disabled]="downloadOperation.isRunning()"
                  (click)="download(current.value.archive)"
                >
                  <mat-icon aria-hidden="true">download</mat-icon
                  >{{ downloadOperation.isRunning() ? 'Preparing ZIP…' : 'Download ZIP' }}
                </button>
              </mat-card-content></mat-card
            >
            @if (downloadOperation.failure(); as downloadError) {
              <p class="download-error" role="alert">{{ downloadError }}</p>
            }
            <lib-trace-screenshot-preview [frames]="current.value.capture.frames" />
          }
          @case ('failure') {
            <mat-card appearance="outlined" class="error-card"
              ><mat-card-content class="result">
                <div class="result__icon result__icon--error"><mat-icon aria-hidden="true">error</mat-icon></div>
                <div class="result__copy">
                  <h2>Couldn’t extract screenshots</h2>
                  <p>{{ current.failure }} Drop another trace anywhere on this page to try again.</p>
                </div>
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
      position: relative;
      width: min(100% - 48px, 920px);
      margin: 32px auto 64px;
    }
    .result {
      display: flex;
      min-height: 110px;
      padding: 24px 28px;
      align-items: center;
      gap: 20px;
    }
    mat-card + lib-trace-screenshot-preview {
      display: block;
      margin-top: 18px;
    }
    .download-error {
      margin: 10px 0 0;
      color: var(--mat-sys-error);
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
    @media (max-width: 680px) {
      .extractor {
        width: min(100% - 28px, 920px);
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
  protected readonly downloadOperation = createEffectOperation({
    execute: downloadScreenshotArchive,
    label: (archive) => archive.downloadName,
    presentFailure: (error) => error.message,
    unexpectedFailure: () => 'An unexpected browser error interrupted the ZIP download. Try again.',
  });
  protected readonly extraction = createEffectOperation({
    execute: prepareScreenshotExtraction,
    label: (file) => file.name,
    presentFailure: (error) => error.message,
    unexpectedFailure: () => 'An unexpected browser error interrupted trace processing.',
  });

  protected extract(file: File): void {
    this.downloadOperation.cancel();
    this.extraction.run(file);
  }

  protected download(archive: ScreenshotArchive): void {
    this.downloadOperation.run(archive);
  }
}
