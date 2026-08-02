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
    <main
      class="extractor"
      aria-labelledby="page-title"
      (dragenter)="startPageDrag($event)"
      (dragover)="continuePageDrag($event)"
      (dragleave)="leavePageDrag($event)"
      (drop)="dropOnPage($event)"
    >
      <a mat-button routerLink="/convenience"><mat-icon aria-hidden="true">arrow_back</mat-icon>All tools</a>
      @if (state(); as current) {
        @if (isPageDropActive()) {
          <div class="drop-overlay" role="status">
            <div>
              <mat-icon aria-hidden="true">file_download</mat-icon>
              <h2>Drop to replace this trace</h2>
              <p>The new preview will appear automatically.</p>
            </div>
          </div>
        }
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
                  <h2>
                    {{ current.archive.frameCount }} screenshot{{ current.archive.frameCount === 1 ? '' : 's' }}
                    {{ current.archive.frameCount === 1 ? 'is' : 'are' }} ready
                  </h2>
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
                  <p>{{ current.message }} Drop another trace anywhere on this page to try again.</p>
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
    .drop-overlay {
      position: fixed;
      z-index: 1000;
      display: grid;
      border: 4px solid var(--mat-sys-primary);
      background: color-mix(in srgb, var(--mat-sys-primary-container) 92%, transparent);
      backdrop-filter: blur(8px);
      inset: 16px;
      border-radius: 28px;
      text-align: center;
      pointer-events: none;
      place-items: center;
    }
    .drop-overlay > div {
      padding: 40px;
    }
    .drop-overlay mat-icon {
      width: 64px;
      height: 64px;
      color: var(--mat-sys-primary);
      font-size: 64px;
    }
    .drop-overlay h2 {
      margin: 18px 0 6px;
      font: var(--mat-sys-headline-medium);
    }
    .drop-overlay p {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-large);
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
  protected readonly state = signal<ExtractionState>({ status: 'idle' });
  protected readonly isPageDropActive = signal(false);
  private extractionId = 0;
  private pageDragDepth = 0;

  protected startPageDrag(event: DragEvent): void {
    if (this.state().status === 'idle' || !event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    this.pageDragDepth += 1;
    this.isPageDropActive.set(true);
  }

  protected continuePageDrag(event: DragEvent): void {
    if (this.state().status === 'idle' || !event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
  }

  protected leavePageDrag(event: DragEvent): void {
    if (this.state().status === 'idle') return;
    event.preventDefault();
    this.pageDragDepth = Math.max(0, this.pageDragDepth - 1);
    if (this.pageDragDepth === 0) this.isPageDropActive.set(false);
  }

  protected dropOnPage(event: DragEvent): void {
    if (this.state().status === 'idle') return;
    event.preventDefault();
    this.pageDragDepth = 0;
    this.isPageDropActive.set(false);
    const file = event.dataTransfer?.files.item(0);
    if (file) this.extract(file);
  }

  protected extract(file: File): void {
    const extractionId = ++this.extractionId;
    this.state.set({ status: 'processing', fileName: file.name });
    void Effect.runPromise(
      Effect.match(buildScreenshotArchive(file), {
        onFailure: (error): ExtractionState => ({ status: 'error', fileName: file.name, message: error.message }),
        onSuccess: (archive): ExtractionState => ({ status: 'ready', fileName: file.name, archive }),
      }),
    ).then((state) => {
      if (this.extractionId === extractionId) this.state.set(state);
    });
  }

  protected download(archive: ScreenshotArchive): void {
    downloadScreenshotArchive(archive);
  }
}
