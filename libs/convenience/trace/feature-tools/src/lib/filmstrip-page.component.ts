import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog, type MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { defaultTraceFilmstripSettings, type TraceFilmstripSettings } from '@app-speed/convenience/trace/domain';
import {
  displayFilmstripFrames,
  downloadFilmstripPng,
  loadTraceFilmstrip,
  type LoadedTraceFilmstrip,
} from '@app-speed/convenience/trace/portal-data-access';
import {
  TraceDropZoneComponent,
  TraceFilmstripComponent,
  TraceFilmstripSettingsDialogComponent,
  type TraceFilmstripSettingsDialogData,
} from '@app-speed/convenience/trace/portal-ui';
import { Effect } from 'effect';

type FilmstripPageState =
  | { readonly status: 'idle' }
  | { readonly status: 'processing'; readonly fileName: string }
  | { readonly status: 'ready'; readonly trace: LoadedTraceFilmstrip }
  | { readonly status: 'invalid-trace'; readonly fileName: string; readonly message: string }
  | { readonly status: 'no-screenshots'; readonly fileName: string; readonly message: string }
  | { readonly status: 'error'; readonly fileName: string; readonly message: string };

@Component({
  selector: 'lib-filmstrip-page',
  imports: [
    MatButton,
    MatCard,
    MatCardContent,
    MatIcon,
    MatProgressSpinner,
    RouterLink,
    TraceDropZoneComponent,
    TraceFilmstripComponent,
  ],
  template: `
    <main
      class="page"
      [class.page--ready]="state().status === 'ready'"
      aria-labelledby="filmstrip-page-title"
      (dragenter)="startPageDrag($event)"
      (dragover)="continuePageDrag($event)"
      (dragleave)="leavePageDrag($event)"
      (drop)="dropOnPage($event)"
    >
      <a mat-button routerLink="/convenience/trace"><mat-icon aria-hidden="true">arrow_back</mat-icon>Trace tools</a>
      <header class="page-header">
        <p class="eyebrow">Trace tool</p>
        <h1 id="filmstrip-page-title">Trace filmstrip</h1>
        <p>Inspect captured frames and export the filtered timeline as a PNG. Your trace never leaves this browser.</p>
      </header>
      @if (isPageDropActive()) {
        <div class="drop-overlay" role="status">
          <div>
            <mat-icon aria-hidden="true">file_download</mat-icon>
            <h2>Drop to replace this trace</h2>
          </div>
        </div>
      }
      @switch (state().status) {
        @case ('idle') {
          <lib-trace-drop-zone (fileSelected)="load($event)" />
        }
        @case ('processing') {
          <mat-card appearance="outlined"
            ><mat-card-content class="status"
              ><mat-spinner diameter="44" />
              <div>
                <h2>Reading trace</h2>
                <p>{{ fileName() }}</p>
              </div></mat-card-content
            ></mat-card
          >
        }
        @case ('error') {
          <mat-card appearance="outlined" class="error" role="alert"
            ><mat-card-content class="status"
              ><mat-icon aria-hidden="true">error</mat-icon>
              <div>
                <h2>Couldn’t create filmstrip</h2>
                <p>{{ errorMessage() }} Drop another trace anywhere on this page to try again.</p>
              </div></mat-card-content
            ></mat-card
          >
        }
        @case ('invalid-trace') {
          <mat-card appearance="outlined" class="error" role="alert">
            <mat-card-content class="status"
              ><mat-icon aria-hidden="true">error</mat-icon>
              <div>
                <h2>Invalid trace</h2>
                <p>{{ errorMessage() }} Drop another trace anywhere on this page to try again.</p>
              </div></mat-card-content
            >
          </mat-card>
        }
        @case ('no-screenshots') {
          <mat-card appearance="outlined" class="error" role="status">
            <mat-card-content class="status"
              ><mat-icon aria-hidden="true">image_not_supported</mat-icon>
              <div>
                <h2>No screenshots found</h2>
                <p>{{ errorMessage() }} Drop another trace anywhere on this page to try again.</p>
              </div></mat-card-content
            >
          </mat-card>
        }
        @case ('ready') {
          @if (trace(); as loaded) {
            <div class="ready" aria-live="polite">
              <span><mat-icon aria-hidden="true">check_circle</mat-icon>{{ loaded.sourceFileName }}</span>
              <div class="actions">
                <button mat-button type="button" (click)="openSettings()">
                  <mat-icon aria-hidden="true">tune</mat-icon>Advanced settings
                </button>
                <button mat-flat-button type="button" [disabled]="isExporting()" (click)="exportPng()">
                  <mat-icon aria-hidden="true">download</mat-icon>{{ isExporting() ? 'Creating PNG…' : 'Download PNG' }}
                </button>
              </div>
            </div>
            @if (exportError()) {
              <p class="export-error" role="alert">{{ exportError() }}</p>
            }
            <lib-trace-filmstrip
              [frames]="displayedFrames()"
              [sourceFrameCount]="loaded.frames.length"
              [durationMilliseconds]="loaded.durationMilliseconds"
              [settings]="settings()"
            />
          }
        }
      }
    </main>
  `,
  styles: `
    :host {
      display: block;
    }
    .page {
      position: relative;
      width: min(100% - 48px, 1120px);
      margin: 32px auto 64px;
    }
    .page--ready {
      width: min(95vw, 1600px);
    }
    .page-header {
      margin: 26px 0 30px;
    }
    .eyebrow {
      margin: 0 0 6px;
      color: var(--mat-sys-primary, #0b57d0);
      font: var(--mat-sys-label-large, 600 0.75rem/1rem Roboto, sans-serif);
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    h1 {
      margin: 0 0 12px;
      color: var(--mat-sys-on-surface, #1f1f1f);
      font: var(--mat-sys-display-small, 700 2.5rem/1.1 Roboto, sans-serif);
      letter-spacing: -0.025em;
    }
    .page-header > p:last-child {
      max-width: 720px;
      margin: 0;
      color: var(--mat-sys-on-surface-variant, #444746);
      font: var(--mat-sys-body-large, 400 1.05rem/1.55rem Roboto, sans-serif);
    }
    .status {
      display: flex;
      min-height: 110px;
      padding: 24px;
      align-items: center;
      gap: 20px;
    }
    .status h2 {
      margin: 0 0 4px;
    }
    .status p {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
    }
    .error {
      border-color: var(--mat-sys-error);
    }
    .error .status > mat-icon,
    .export-error {
      color: var(--mat-sys-error);
    }
    .ready {
      display: flex;
      margin-bottom: 16px;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .ready span {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ready span mat-icon {
      color: var(--mat-sys-primary);
    }
    .actions {
      display: flex;
      gap: 8px;
    }
    .drop-overlay {
      position: fixed;
      z-index: 1000;
      display: grid;
      inset: 16px;
      border: 4px solid var(--mat-sys-primary);
      border-radius: 28px;
      background: color-mix(in srgb, var(--mat-sys-primary-container) 92%, transparent);
      pointer-events: none;
      place-items: center;
      text-align: center;
    }
    .drop-overlay mat-icon {
      width: 64px;
      height: 64px;
      color: var(--mat-sys-primary);
      font-size: 64px;
    }
    @media (max-width: 680px) {
      .page {
        width: calc(100% - 28px);
      }
      h1 {
        font-size: 2rem;
      }
      .ready {
        align-items: stretch;
        flex-direction: column;
      }
      .actions {
        flex-wrap: wrap;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilmstripPageComponent {
  protected readonly state = signal<FilmstripPageState>({ status: 'idle' });
  protected readonly settings = signal<TraceFilmstripSettings>(defaultTraceFilmstripSettings);
  protected readonly isPageDropActive = signal(false);
  protected readonly isExporting = signal(false);
  protected readonly exportError = signal<string | null>(null);
  protected readonly trace = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.trace : undefined;
  });
  protected readonly fileName = computed(() => {
    const state = this.state();
    return state.status === 'idle' || state.status === 'ready' ? '' : state.fileName;
  });
  protected readonly errorMessage = computed(() => {
    const state = this.state();
    return state.status === 'error' || state.status === 'invalid-trace' || state.status === 'no-screenshots'
      ? state.message
      : '';
  });
  protected readonly displayedFrames = computed(() => {
    const trace = this.trace();
    return trace ? displayFilmstripFrames(trace, this.settings()) : [];
  });
  private operationId = 0;
  private pageDragDepth = 0;
  private activeController: AbortController | undefined;
  private readonly dialog = inject(MatDialog);
  private settingsDialogRef: MatDialogRef<TraceFilmstripSettingsDialogComponent, TraceFilmstripSettings> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.operationId += 1;
      this.activeController?.abort();
      this.settingsDialogRef?.close();
    });
  }

  protected load(file: File): void {
    const operationId = ++this.operationId;
    this.activeController?.abort();
    this.settingsDialogRef?.close();
    const controller = new AbortController();
    this.activeController = controller;
    this.isExporting.set(false);
    this.exportError.set(null);
    this.state.set({ status: 'processing', fileName: file.name });
    void Effect.runPromise(
      Effect.match(loadTraceFilmstrip(file), {
        onFailure: (error): FilmstripPageState => {
          if (error._tag === 'InvalidTraceError')
            return { status: 'invalid-trace', fileName: file.name, message: error.message };
          if (error._tag === 'NoScreenshotFramesError')
            return { status: 'no-screenshots', fileName: file.name, message: error.message };
          return { status: 'error', fileName: file.name, message: error.message };
        },
        onSuccess: (trace): FilmstripPageState => ({ status: 'ready', trace }),
      }),
      { signal: controller.signal },
    )
      .then((state) => {
        if (operationId !== this.operationId) return;
        if (state.status === 'ready')
          this.settings.update((settings) => ({
            ...settings,
            startMilliseconds: 0,
            endMilliseconds: state.trace.durationMilliseconds,
          }));
        this.state.set(state);
      })
      .catch(() => {
        if (operationId === this.operationId && !controller.signal.aborted) {
          this.state.set({
            status: 'error',
            fileName: file.name,
            message: 'An unexpected browser error interrupted trace processing.',
          });
        }
      });
  }

  protected updateSettings(settings: TraceFilmstripSettings): void {
    this.settings.set(settings);
    this.exportError.set(null);
  }

  protected openSettings(): void {
    const trace = this.trace();
    if (!trace) return;
    this.settingsDialogRef?.close();
    const dialogRef = this.dialog.open<
      TraceFilmstripSettingsDialogComponent,
      TraceFilmstripSettingsDialogData,
      TraceFilmstripSettings
    >(TraceFilmstripSettingsDialogComponent, {
      data: { settings: this.settings(), durationMilliseconds: trace.durationMilliseconds },
      ariaLabel: 'Advanced filmstrip settings',
      ariaModal: true,
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      maxWidth: '94vw',
    });
    this.settingsDialogRef = dialogRef;
    dialogRef.afterClosed().subscribe((settings) => {
      if (settings) this.updateSettings(settings);
      if (this.settingsDialogRef === dialogRef) this.settingsDialogRef = undefined;
    });
  }

  protected exportPng(): void {
    const trace = this.trace();
    if (!trace || this.isExporting()) return;
    const operationId = this.operationId;
    this.activeController?.abort();
    const controller = new AbortController();
    this.activeController = controller;
    this.isExporting.set(true);
    this.exportError.set(null);
    void Effect.runPromise(
      Effect.match(downloadFilmstripPng(trace.sourceFileName, this.displayedFrames(), this.settings()), {
        onFailure: (error) => error.message,
        onSuccess: () => null,
      }),
      { signal: controller.signal },
    )
      .then((message) => {
        if (operationId !== this.operationId) return;
        this.exportError.set(message);
        this.isExporting.set(false);
      })
      .catch(() => {
        if (operationId === this.operationId && !controller.signal.aborted) {
          this.exportError.set('An unexpected browser error interrupted PNG export. Try again.');
          this.isExporting.set(false);
        }
      });
  }

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
    if (file) this.load(file);
  }
}
