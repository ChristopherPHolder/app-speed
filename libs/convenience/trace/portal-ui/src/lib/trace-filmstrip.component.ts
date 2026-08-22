import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { MatDialog, type MatDialogRef } from '@angular/material/dialog';
import type { TraceFilmstripSettings } from '@app-speed/convenience/trace/domain';
import {
  TraceFilmstripPreviewDialogComponent,
  type TraceFilmstripPreviewData,
} from './trace-filmstrip-preview-dialog.component';
import { createFrameNavigator } from './frame-navigator';

export interface TraceFilmstripUiFrame {
  readonly source: string;
  readonly sourceIndex: number;
  readonly displayTimestampMicroseconds: number;
  readonly offsetMilliseconds: number;
  readonly deltaMilliseconds: number;
}

@Component({
  selector: 'lib-trace-filmstrip',
  template: `
    <section class="filmstrip" [attr.aria-label]="accessibleName()">
      <header>
        @if (showLabel()) {
          <div class="identity">
            <p>Visual timeline</p>
            <h2>{{ heading() }}</h2>
            @if (sourceFileName()) {
              <span class="source-name" [title]="sourceFileName()">{{ sourceFileName() }}</span>
            }
          </div>
        }
        <div class="summary" aria-live="polite">
          <strong>{{ sourceFrameCount() }} source frame{{ sourceFrameCount() === 1 ? '' : 's' }}</strong>
          @if (frames().length !== sourceFrameCount()) {
            <span>{{ frames().length }} displayed frames</span>
          }
          <span>{{ formatMilliseconds(durationMilliseconds()) }} trace duration</span>
        </div>
      </header>
      <div
        class="track-shell"
        [class.has-overflow-left]="hasOverflowLeft()"
        [class.has-overflow-right]="hasOverflowRight()"
      >
        <div #track class="track" aria-label="Displayed trace frames" (scroll)="updateOverflow()">
          @for (
            frame of frames();
            track frame.displayTimestampMicroseconds + ':' + frame.sourceIndex;
            let index = $index
          ) {
            <button
              type="button"
              (click)="openPreview(index)"
              [class.has-timestamp]="settings().showTimestamps"
              [class.is-selected]="navigator.selectedIndex() === index"
              [attr.aria-pressed]="navigator.selectedIndex() === index"
              [attr.aria-label]="'Preview frame at ' + formatMilliseconds(frame.offsetMilliseconds)"
            >
              <img
                [src]="frame.source"
                [style.height.px]="settings().imageHeight"
                alt=""
                loading="lazy"
                (load)="updateOverflow()"
              />
              @if (settings().showTimestamps) {
                <span class="timestamp">
                  {{ formatMilliseconds(frame.offsetMilliseconds) }}
                  @if (!settings().useFixedInterval && index > 0) {
                    <small>+{{ formatMilliseconds(frame.deltaMilliseconds) }}</small>
                  }
                </span>
              }
            </button>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .filmstrip {
      min-width: 0;
    }
    header {
      display: flex;
      align-items: end;
      justify-content: space-between;
      margin-bottom: 16px;
      gap: 20px;
    }
    header p {
      margin: 0;
      color: var(--mat-sys-primary, #0b57d0);
      font: var(--mat-sys-label-large, 600 0.75rem/1rem Roboto, sans-serif);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    h2 {
      margin: 2px 0 0;
      font: var(--mat-sys-headline-small, 600 1.25rem/1.6rem Roboto, sans-serif);
    }
    .identity {
      min-width: 0;
    }
    .source-name {
      display: block;
      max-width: min(48vw, 620px);
      overflow: hidden;
      color: var(--mat-sys-on-surface-variant, #444746);
      font: var(--mat-sys-body-small, 400 0.75rem/1rem Roboto, sans-serif);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .summary {
      display: flex;
      flex-wrap: wrap;
      justify-content: end;
      gap: 4px 8px;
      text-align: right;
    }
    .summary > * + *::before {
      margin-right: 8px;
      color: var(--mat-sys-outline, #747775);
      content: '·';
    }
    .summary span {
      color: var(--mat-sys-on-surface-variant, #444746);
    }
    .track-shell {
      position: relative;
      min-width: 0;
    }
    .track-shell::before,
    .track-shell::after {
      position: absolute;
      z-index: 3;
      top: 8px;
      bottom: 10px;
      width: 20px;
      pointer-events: none;
      content: '';
      opacity: 0;
      transition: opacity 120ms ease;
    }
    .track-shell::before {
      left: 0;
      background: linear-gradient(to right, var(--mat-sys-surface, #ffffff), transparent);
    }
    .track-shell::after {
      right: 0;
      background: linear-gradient(to left, var(--mat-sys-surface, #ffffff), transparent);
    }
    .track-shell.has-overflow-left::before,
    .track-shell.has-overflow-right::after {
      opacity: 1;
    }
    .track {
      display: flex;
      overflow-x: auto;
      padding: 8px 0 10px;
      gap: 0;
      scrollbar-color: var(--mat-sys-outline-variant) var(--mat-sys-surface-container-low);
      scrollbar-width: thin;
    }
    .track::-webkit-scrollbar {
      height: 7px;
    }
    .track::-webkit-scrollbar-track {
      background: var(--mat-sys-surface-container-low, #f1f3f4);
    }
    .track::-webkit-scrollbar-thumb {
      border-radius: 999px;
      background: var(--mat-sys-outline-variant, #c4c7c5);
    }
    .track button {
      position: relative;
      display: flex;
      width: max-content;
      flex: 0 0 auto;
      align-items: center;
      flex-direction: column;
      padding: 0;
      overflow: hidden;
      border: 0;
      border-right: 1px solid var(--mat-sys-outline-variant, #c4c7c5);
      border-radius: 0;
      background: var(--mat-sys-surface, #ffffff);
      color: var(--mat-sys-on-surface, #1f1f1f);
      cursor: pointer;
      box-shadow: none;
    }
    .track button:hover,
    .track button:focus-visible {
      z-index: 2;
      outline: 2px solid var(--mat-sys-primary, #0b57d0);
      outline-offset: -2px;
    }
    .track button.is-selected {
      z-index: 1;
      outline: 3px solid var(--mat-sys-primary, #0b57d0);
      outline-offset: -3px;
    }
    .track button.has-timestamp {
      padding-bottom: 36px;
    }
    .track img {
      display: block;
      flex: none;
      width: auto;
      height: 180px;
      max-width: none;
      aspect-ratio: auto;
      background: var(--mat-sys-surface-container-lowest, #ffffff);
      object-fit: contain;
    }
    .timestamp {
      box-sizing: border-box;
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;
      display: flex;
      width: 100%;
      height: 36px;
      min-width: 0;
      align-items: baseline;
      align-content: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 6px;
      overflow: hidden;
      padding: 2px 4px;
      color: var(--mat-sys-on-surface-variant, #444746);
      background: var(--mat-sys-surface-container-lowest, #ffffff);
      font:
        500 0.75rem/1rem ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;
      font-variant-numeric: tabular-nums;
      text-align: center;
    }
    small {
      color: var(--mat-sys-outline, #747775);
      font: inherit;
    }
    @media (max-width: 680px) {
      header {
        align-items: start;
        flex-direction: column;
        gap: 8px;
      }
      .summary {
        display: grid;
        grid-template-columns: auto auto;
        justify-content: start;
        text-align: left;
      }
      .summary > * + *::before {
        content: none;
      }
      .summary span:last-child {
        grid-column: 1 / -1;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraceFilmstripComponent {
  readonly frames = input.required<ReadonlyArray<TraceFilmstripUiFrame>>();
  readonly sourceFrameCount = input.required<number>();
  readonly durationMilliseconds = input.required<number>();
  readonly settings = input.required<TraceFilmstripSettings>();
  readonly heading = input('Filmstrip');
  readonly sourceFileName = input('');
  readonly showLabel = input(true);
  readonly accessibleName = input('Filmstrip');
  protected readonly navigator = createFrameNavigator({ frames: this.frames, key: (frame) => frame.sourceIndex });
  protected readonly hasOverflowLeft = signal(false);
  protected readonly hasOverflowRight = signal(false);
  private readonly track = viewChild<ElementRef<HTMLElement>>('track');
  private readonly dialog = inject(MatDialog);
  private previewRef: MatDialogRef<TraceFilmstripPreviewDialogComponent> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.previewRef?.close());
  }

  @HostListener('window:resize')
  protected updateOverflow(): void {
    const track = this.track()?.nativeElement;
    if (!track) return;
    this.hasOverflowLeft.set(track.scrollLeft > 1);
    this.hasOverflowRight.set(track.scrollLeft + track.clientWidth < track.scrollWidth - 1);
  }

  protected openPreview(selectedIndex: number): void {
    this.navigator.select(selectedIndex);
    this.previewRef?.close();
    const previewRef = this.dialog.open<TraceFilmstripPreviewDialogComponent, TraceFilmstripPreviewData>(
      TraceFilmstripPreviewDialogComponent,
      {
        data: { navigator: this.navigator },
        ariaLabel: 'Trace frame preview',
        ariaModal: true,
        autoFocus: 'button[aria-label="Close frame preview"]',
        restoreFocus: true,
        maxWidth: '96vw',
      },
    );
    this.previewRef = previewRef;
    previewRef.afterClosed().subscribe(() => {
      if (this.previewRef === previewRef) this.previewRef = undefined;
    });
  }
  protected formatMilliseconds(value: number): string {
    return `${value.toFixed(1)} ms`;
  }
}
