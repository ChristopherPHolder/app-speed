import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog, type MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import {
  defaultFilmstripComparisonLabel,
  defaultTraceFilmstripSettings,
  type FilmstripComparisonLabelSettings,
  type TraceFilmstripSettings,
} from '@app-speed/convenience/trace/domain';
import {
  displayFilmstripFrames,
  downloadFilmstripComparisonPng,
  loadTraceCapture,
  type BrowserFilmstripComparisonRow,
  type LoadedTraceCapture,
} from '@app-speed/convenience/trace/portal-data-access';
import {
  TraceDropZoneComponent,
  TraceFileDropDirective,
  TraceFileDropOverlayComponent,
  TraceFilmstripComparisonSettingsDialogComponent,
  TraceFilmstripComponent,
  type TraceFilmstripComparisonSettingsDialogData,
  type TraceFilmstripComparisonSettingsDialogResult,
} from '@app-speed/convenience/trace/portal-ui';
import { createEffectOperation, type EffectOperation } from './effect-operation';

interface TraceFailurePresentation {
  readonly kind: 'invalid-trace' | 'no-screenshots' | 'error';
  readonly message: string;
}

interface ComparisonRow {
  readonly slotName: 'Trace A' | 'Trace B';
  readonly settings: WritableSignal<TraceFilmstripSettings>;
  readonly label: WritableSignal<FilmstripComparisonLabelSettings>;
  readonly load: EffectOperation<File, LoadedTraceCapture, TraceFailurePresentation>;
  readonly displayedFrames: Signal<ReturnType<typeof displayFilmstripFrames>>;
}

@Component({
  selector: 'lib-filmstrip-comparison-page',
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
    <main class="page" aria-labelledby="filmstrip-comparison-page-title">
      <a mat-button routerLink="/convenience"><mat-icon aria-hidden="true">arrow_back</mat-icon>All tools</a>
      <header class="page-header">
        <p class="eyebrow">Trace tool</p>
        <h1 id="filmstrip-comparison-page-title">Compare trace filmstrips</h1>
        <p>Inspect two independently configured traces and download both filmstrips as one PNG.</p>
      </header>

      <div class="comparison-actions">
        <p>Each trace stays in this browser and can be replaced independently.</p>
        <button mat-flat-button type="button" [disabled]="!canExport()" (click)="exportComparison()">
          <mat-icon aria-hidden="true">download</mat-icon>
          {{ exportOperation.isRunning() ? 'Creating comparison…' : 'Download comparison PNG' }}
        </button>
      </div>
      @if (exportOperation.failure(); as exportError) {
        <p class="export-error" role="alert">{{ exportError }}</p>
      }

      <div class="rows">
        @for (row of rows; track row.slotName) {
          <mat-card
            appearance="outlined"
            class="row"
            [attr.aria-label]="row.slotName + ' filmstrip slot'"
            libTraceFileDrop
            #replacement="traceFileDrop"
            [libTraceFileDropEnabled]="row.load.state().status !== 'idle'"
            (fileDropped)="loadRow(row, $event)"
          >
            @if (replacement.active()) {
              <lib-trace-file-drop-overlay />
            }
            <mat-card-content>
              <header class="row-header">
                <div class="row-identity">
                  @if (row.label().includeLabel) {
                    <p>{{ row.slotName }}</p>
                    <h2>{{ row.label().label }}</h2>
                    @if (row.load.result(); as loaded) {
                      <span class="source-name" [title]="loaded.sourceFileName">{{ loaded.sourceFileName }}</span>
                    }
                  } @else {
                    <h2 class="visually-hidden">{{ row.slotName }}</h2>
                  }
                </div>
                @if (row.load.state().status === 'success') {
                  <button mat-button type="button" (click)="openSettings(row)">
                    <mat-icon aria-hidden="true">tune</mat-icon>Advanced settings
                  </button>
                }
              </header>

              @switch (row.load.state().status) {
                @case ('idle') {
                  <lib-trace-drop-zone (fileSelected)="loadRow(row, $event)" />
                }
                @case ('running') {
                  <div class="status" role="status">
                    <mat-spinner diameter="40" />
                    <div>
                      <h3>Reading {{ row.slotName }}</h3>
                      <p>{{ runningLabel(row) }}</p>
                    </div>
                  </div>
                }
                @case ('failure') {
                  @if (row.load.failure(); as failure) {
                    <div class="status error" [attr.role]="failure.kind === 'no-screenshots' ? 'status' : 'alert'">
                      <mat-icon aria-hidden="true">{{
                        failure.kind === 'no-screenshots' ? 'image_not_supported' : 'error'
                      }}</mat-icon>
                      <div>
                        <h3>{{ failureHeading(failure) }}</h3>
                        <p>{{ failure.message }} Drop another trace on this row to try again.</p>
                      </div>
                    </div>
                  }
                }
                @case ('success') {
                  @if (row.load.result(); as loaded) {
                    <lib-trace-filmstrip
                      [frames]="row.displayedFrames()"
                      [sourceFrameCount]="loaded.frames.length"
                      [durationMilliseconds]="loaded.durationMilliseconds"
                      [settings]="row.settings()"
                      [showLabel]="false"
                      [accessibleName]="row.slotName + ' filmstrip'"
                    />
                  }
                }
              }
            </mat-card-content>
          </mat-card>
        }
      </div>
    </main>
  `,
  styles: `
    :host {
      display: block;
    }
    .page {
      width: min(95vw, 1600px);
      margin: 32px auto 64px;
    }
    .page-header {
      margin: 26px 0 24px;
    }
    .eyebrow,
    .row-identity > p {
      margin: 0 0 6px;
      color: var(--mat-sys-primary, #0b57d0);
      font: var(--mat-sys-label-large, 600 0.75rem/1rem Roboto, sans-serif);
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    h1 {
      margin: 0 0 12px;
      font: var(--mat-sys-display-small, 700 2.5rem/1.1 Roboto, sans-serif);
    }
    .page-header > p:last-child,
    .comparison-actions p,
    .status p,
    .source-name {
      color: var(--mat-sys-on-surface-variant, #444746);
    }
    .page-header > p:last-child,
    .comparison-actions p,
    .status p {
      margin: 0;
    }
    .comparison-actions,
    .row-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .comparison-actions {
      margin-bottom: 18px;
    }
    .rows {
      display: grid;
      gap: 24px;
    }
    .row {
      position: relative;
      min-width: 0;
      overflow: hidden;
    }
    .row mat-card-content {
      padding: 24px;
    }
    .row-header {
      margin-bottom: 18px;
    }
    .row-identity {
      min-width: 0;
    }
    .row-identity h2 {
      margin: 0;
      font: var(--mat-sys-headline-small);
    }
    .source-name {
      display: block;
      max-width: min(60vw, 760px);
      overflow: hidden;
      font: var(--mat-sys-body-small);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .status {
      display: flex;
      min-height: 150px;
      align-items: center;
      justify-content: center;
      gap: 18px;
    }
    .status h3 {
      margin: 0 0 4px;
    }
    .error {
      color: var(--mat-sys-error);
    }
    .error p {
      max-width: 680px;
    }
    .export-error {
      margin: -6px 0 16px;
      color: var(--mat-sys-error);
    }
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
    @media (max-width: 680px) {
      .page {
        width: calc(100% - 28px);
      }
      h1 {
        font-size: 2rem;
      }
      .comparison-actions,
      .row-header {
        align-items: stretch;
        flex-direction: column;
      }
      .comparison-actions button,
      .row-header button {
        align-self: start;
      }
      .row mat-card-content {
        padding: 16px;
      }
      .source-name {
        max-width: calc(100vw - 64px);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilmstripComparisonPageComponent {
  protected readonly rowA = this.createRow('Trace A');
  protected readonly rowB = this.createRow('Trace B');
  protected readonly rows: readonly [ComparisonRow, ComparisonRow] = [this.rowA, this.rowB];
  protected readonly exportOperation = createEffectOperation({
    execute: (rows: readonly [BrowserFilmstripComparisonRow, BrowserFilmstripComparisonRow]) =>
      downloadFilmstripComparisonPng(rows[0], rows[1]),
    label: ([first, second]) => `${first.sourceFileName} vs ${second.sourceFileName}`,
    presentFailure: (error) => error.message,
    unexpectedFailure: () => 'An unexpected browser error interrupted comparison export. Try again.',
  });
  protected readonly canExport = computed(
    () =>
      this.rowA.load.state().status === 'success' &&
      this.rowB.load.state().status === 'success' &&
      !this.exportOperation.isRunning(),
  );
  private readonly dialog = inject(MatDialog);
  private rowADialog:
    | MatDialogRef<TraceFilmstripComparisonSettingsDialogComponent, TraceFilmstripComparisonSettingsDialogResult>
    | undefined;
  private rowBDialog:
    | MatDialogRef<TraceFilmstripComparisonSettingsDialogComponent, TraceFilmstripComparisonSettingsDialogResult>
    | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.rowADialog?.close();
      this.rowBDialog?.close();
    });
  }

  protected loadRow(row: ComparisonRow, file: File): void {
    this.closeDialog(row);
    this.exportOperation.cancel();
    row.load.run(file);
  }

  protected openSettings(row: ComparisonRow): void {
    const trace = row.load.result();
    if (!trace) return;
    this.closeDialog(row);
    const dialogRef = this.dialog.open<
      TraceFilmstripComparisonSettingsDialogComponent,
      TraceFilmstripComparisonSettingsDialogData,
      TraceFilmstripComparisonSettingsDialogResult
    >(TraceFilmstripComparisonSettingsDialogComponent, {
      data: { settings: row.settings(), label: row.label(), durationMilliseconds: trace.durationMilliseconds },
      ariaLabel: `${row.slotName} advanced filmstrip settings`,
      ariaModal: true,
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      maxWidth: '94vw',
    });
    this.setDialog(row, dialogRef);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        row.settings.set(result.settings);
        row.label.set(result.label);
        this.exportOperation.reset();
      }
      if (this.getDialog(row) === dialogRef) this.setDialog(row, undefined);
    });
  }

  protected exportComparison(): void {
    const first = this.exportRow(this.rowA);
    const second = this.exportRow(this.rowB);
    if (!first || !second || !this.canExport()) return;
    this.exportOperation.run([first, second]);
  }

  protected runningLabel(row: ComparisonRow): string {
    const state = row.load.state();
    return state.status === 'running' ? state.label : '';
  }

  protected failureHeading(failure: TraceFailurePresentation): string {
    if (failure.kind === 'invalid-trace') return 'Invalid trace';
    if (failure.kind === 'no-screenshots') return 'No screenshots found';
    return 'Couldn’t create filmstrip';
  }

  private createRow(slotName: 'Trace A' | 'Trace B'): ComparisonRow {
    const settings = signal<TraceFilmstripSettings>({ ...defaultTraceFilmstripSettings });
    const label = signal(defaultFilmstripComparisonLabel(slotName));
    const load = createEffectOperation({
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
        settings.update((current) => ({
          ...current,
          startMilliseconds: 0,
          endMilliseconds: trace.durationMilliseconds,
        })),
    });
    return {
      slotName,
      settings,
      label,
      load,
      displayedFrames: computed(() => {
        const trace = load.result();
        return trace ? displayFilmstripFrames(trace, settings()) : [];
      }),
    };
  }

  private exportRow(row: ComparisonRow): BrowserFilmstripComparisonRow | undefined {
    const trace = row.load.result();
    if (!trace) return undefined;
    return {
      sourceFileName: trace.sourceFileName,
      frames: row.displayedFrames(),
      settings: row.settings(),
      label: row.label(),
    };
  }

  private closeDialog(row: ComparisonRow): void {
    this.getDialog(row)?.close();
  }

  private getDialog(
    row: ComparisonRow,
  ):
    | MatDialogRef<TraceFilmstripComparisonSettingsDialogComponent, TraceFilmstripComparisonSettingsDialogResult>
    | undefined {
    return row === this.rowA ? this.rowADialog : this.rowBDialog;
  }

  private setDialog(
    row: ComparisonRow,
    dialog:
      | MatDialogRef<TraceFilmstripComparisonSettingsDialogComponent, TraceFilmstripComparisonSettingsDialogResult>
      | undefined,
  ): void {
    if (row === this.rowA) this.rowADialog = dialog;
    else this.rowBDialog = dialog;
  }
}
