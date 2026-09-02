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
  loadTraceCapture,
} from '@app-speed/convenience/trace/portal-data-access';
import {
  TraceDropZoneComponent,
  TraceFileDropDirective,
  TraceFileDropOverlayComponent,
  TraceFilmstripComponent,
  TraceFilmstripSettingsDialogComponent,
  type TraceFilmstripSettingsDialogData,
} from '@app-speed/convenience/trace/portal-ui';
import { createEffectOperation } from './effect-operation';

interface TraceFailurePresentation {
  readonly kind: 'invalid-trace' | 'no-screenshots' | 'error';
  readonly message: string;
}

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
    TraceFileDropDirective,
    TraceFileDropOverlayComponent,
    TraceFilmstripComponent,
  ],
  template: `
    <main
      class="page"
      [class.page--ready]="loadOperation.state().status === 'success'"
      aria-labelledby="filmstrip-page-title"
      libTraceFileDrop
      #replacement="traceFileDrop"
      [libTraceFileDropEnabled]="loadOperation.state().status !== 'idle'"
      (fileDropped)="load($event)"
    >
      <a mat-button routerLink="/convenience"><mat-icon aria-hidden="true">arrow_back</mat-icon>All tools</a>
      <header class="page-header">
        <p class="eyebrow">Trace tool</p>
        <h1 id="filmstrip-page-title">Trace filmstrip</h1>
        <p>Inspect captured frames and export the filtered timeline as a PNG. Your trace never leaves this browser.</p>
      </header>
      @if (replacement.active()) {
        <lib-trace-file-drop-overlay />
      }
      @switch (loadOperation.state().status) {
        @case ('idle') {
          <lib-trace-drop-zone (fileSelected)="load($event)" />
        }
        @case ('running') {
          <mat-card appearance="outlined"
            ><mat-card-content class="status"
              ><mat-spinner diameter="44" />
              <div>
                <h2>Reading trace</h2>
                <p>{{ loadLabel() }}</p>
              </div></mat-card-content
            ></mat-card
          >
        }
        @case ('failure') {
          @if (loadOperation.failure(); as failure) {
            <mat-card
              appearance="outlined"
              class="error"
              [attr.role]="failure.kind === 'no-screenshots' ? 'status' : 'alert'"
            >
              <mat-card-content class="status"
                ><mat-icon aria-hidden="true">{{
                  failure.kind === 'no-screenshots' ? 'image_not_supported' : 'error'
                }}</mat-icon>
                <div>
                  <h2>{{ failureHeading(failure) }}</h2>
                  <p>{{ failure.message }} Drop another trace anywhere on this page to try again.</p>
                </div></mat-card-content
              >
            </mat-card>
          }
        }
        @case ('success') {
          @if (loadOperation.result(); as loaded) {
            <div class="ready" aria-live="polite">
              <span><mat-icon aria-hidden="true">check_circle</mat-icon>{{ loaded.sourceFileName }}</span>
              <div class="actions">
                <button mat-button type="button" (click)="openSettings()">
                  <mat-icon aria-hidden="true">tune</mat-icon>Advanced settings
                </button>
                <button mat-flat-button type="button" [disabled]="exportOperation.isRunning()" (click)="exportPng()">
                  <mat-icon aria-hidden="true">download</mat-icon
                  >{{ exportOperation.isRunning() ? 'Creating PNG…' : 'Download PNG' }}
                </button>
              </div>
            </div>
            @if (exportOperation.failure(); as exportError) {
              <p class="export-error" role="alert">{{ exportError }}</p>
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
  protected readonly settings = signal<TraceFilmstripSettings>(defaultTraceFilmstripSettings);
  protected readonly exportOperation = createEffectOperation({
    execute: (request: {
      readonly sourceFileName: string;
      readonly frames: ReturnType<typeof displayFilmstripFrames>;
      readonly settings: TraceFilmstripSettings;
    }) => downloadFilmstripPng(request.sourceFileName, request.frames, request.settings),
    label: (request) => request.sourceFileName,
    presentFailure: (error) => error.message,
    unexpectedFailure: () => 'An unexpected browser error interrupted PNG export. Try again.',
  });
  protected readonly loadOperation = createEffectOperation({
    execute: loadTraceCapture,
    label: (file) => file.name,
    presentFailure: (error): TraceFailurePresentation => {
      if (error._tag === 'InvalidTraceError') return { kind: 'invalid-trace', message: error.message };
      if (error._tag === 'NoScreenshotFramesError') return { kind: 'no-screenshots', message: error.message };
      return { kind: 'error', message: error.message };
    },
    unexpectedFailure: (): TraceFailurePresentation => ({
      kind: 'error',
      message: 'An unexpected browser error interrupted trace processing.',
    }),
    onSuccess: (trace) =>
      this.settings.update((settings) => ({
        ...settings,
        startMilliseconds: 0,
        endMilliseconds: trace.durationMilliseconds,
      })),
  });
  protected readonly displayedFrames = computed(() => {
    const trace = this.loadOperation.result();
    return trace ? displayFilmstripFrames(trace, this.settings()) : [];
  });
  protected readonly loadLabel = computed(() => {
    const state = this.loadOperation.state();
    return state.status === 'running' ? state.label : '';
  });
  private readonly dialog = inject(MatDialog);
  private settingsDialogRef: MatDialogRef<TraceFilmstripSettingsDialogComponent, TraceFilmstripSettings> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.settingsDialogRef?.close();
    });
  }

  protected load(file: File): void {
    this.settingsDialogRef?.close();
    this.exportOperation.cancel();
    this.loadOperation.run(file);
  }

  protected updateSettings(settings: TraceFilmstripSettings): void {
    this.settings.set(settings);
    this.exportOperation.reset();
  }

  protected openSettings(): void {
    const trace = this.loadOperation.result();
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
    const trace = this.loadOperation.result();
    if (!trace || this.exportOperation.isRunning()) return;
    this.exportOperation.run({
      sourceFileName: trace.sourceFileName,
      frames: this.displayedFrames(),
      settings: this.settings(),
    });
  }

  protected failureHeading(failure: TraceFailurePresentation): string {
    if (failure.kind === 'invalid-trace') return 'Invalid trace';
    if (failure.kind === 'no-screenshots') return 'No screenshots found';
    return 'Couldn’t create filmstrip';
  }
}
