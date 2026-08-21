import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { createFrameNavigator } from './frame-navigator';

export interface TraceScreenshotPreviewFrame {
  readonly source: string;
  readonly file: string;
  readonly timestampMicroseconds: number;
  readonly offsetMilliseconds: number;
  readonly deltaMilliseconds: number;
}

@Component({
  selector: 'lib-trace-screenshot-preview',
  imports: [MatIcon, MatIconButton],
  template: `
    <section class="preview" aria-labelledby="preview-title">
      <header>
        <div>
          <p class="eyebrow">Frame preview</p>
          <h2 id="preview-title">Visual timeline</h2>
        </div>
        @if (currentFrame(); as frame) {
          <div class="timing" aria-live="polite">
            <strong>{{ formatMilliseconds(frame.offsetMilliseconds) }}</strong>
            <span>+{{ formatMilliseconds(frame.deltaMilliseconds) }} from previous</span>
          </div>
        }
      </header>

      @if (currentFrame(); as frame) {
        <div class="stage">
          <img [src]="frame.source" [alt]="frameAlt(frame.offsetMilliseconds)" />
          <span class="counter">Frame {{ selectedIndex() + 1 }} of {{ frames().length }}</span>
          <button
            mat-icon-button
            class="previous"
            type="button"
            aria-label="Previous screenshot"
            [disabled]="selectedIndex() === 0"
            (click)="previous()"
          >
            <mat-icon>chevron_left</mat-icon>
          </button>
          <button
            mat-icon-button
            class="next"
            type="button"
            aria-label="Next screenshot"
            [disabled]="selectedIndex() === frames().length - 1"
            (click)="next()"
          >
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>

        <div class="filmstrip" aria-label="Screenshot timeline">
          @for (item of frames(); track item.file; let index = $index) {
            <button
              type="button"
              [class.selected]="index === selectedIndex()"
              [attr.aria-current]="index === selectedIndex() ? 'true' : null"
              [attr.aria-label]="frameAlt(item.offsetMilliseconds)"
              (click)="select(index)"
            >
              <img [src]="item.source" alt="" />
              <span>{{ formatMilliseconds(item.offsetMilliseconds) }}</span>
            </button>
          }
        </div>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
    .preview {
      padding: 24px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 24px;
      background: var(--mat-sys-surface-container-low);
    }
    header {
      display: flex;
      margin-bottom: 18px;
      align-items: end;
      justify-content: space-between;
      gap: 20px;
    }
    .eyebrow {
      margin: 0 0 2px;
      color: var(--mat-sys-primary);
      font: var(--mat-sys-label-large);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    h2 {
      margin: 0;
      font: var(--mat-sys-headline-small);
    }
    .timing {
      display: grid;
      text-align: right;
    }
    .timing strong {
      font: var(--mat-sys-title-large);
      font-variant-numeric: tabular-nums;
    }
    .timing span {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-medium);
    }
    .stage {
      position: relative;
      display: grid;
      min-height: 420px;
      overflow: hidden;
      border-radius: 16px;
      background: #16181d;
      place-items: center;
    }
    .stage > img {
      display: block;
      width: 100%;
      max-height: 620px;
      object-fit: contain;
    }
    .stage button {
      position: absolute;
      top: 50%;
      background: color-mix(in srgb, var(--mat-sys-surface) 88%, transparent);
      transform: translateY(-50%);
    }
    .previous {
      left: 14px;
    }
    .next {
      right: 14px;
    }
    .counter {
      position: absolute;
      right: 14px;
      bottom: 14px;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgb(0 0 0 / 70%);
      color: white;
      font: var(--mat-sys-label-medium);
    }
    .filmstrip {
      display: flex;
      margin-top: 14px;
      padding: 3px 3px 10px;
      overflow-x: auto;
      gap: 10px;
    }
    .filmstrip button {
      display: grid;
      width: 132px;
      flex: 0 0 132px;
      padding: 4px;
      border: 2px solid transparent;
      border-radius: 12px;
      background: transparent;
      color: var(--mat-sys-on-surface-variant);
      cursor: pointer;
      gap: 5px;
    }
    .filmstrip button:hover,
    .filmstrip button:focus-visible {
      background: var(--mat-sys-surface-container);
      outline: none;
    }
    .filmstrip button.selected {
      border-color: var(--mat-sys-primary);
      color: var(--mat-sys-primary);
    }
    .filmstrip img {
      width: 120px;
      height: 74px;
      border-radius: 7px;
      background: #16181d;
      object-fit: contain;
    }
    .filmstrip span {
      overflow: hidden;
      font: var(--mat-sys-label-medium);
      font-variant-numeric: tabular-nums;
      text-overflow: ellipsis;
    }
    @media (max-width: 680px) {
      .preview {
        padding: 16px;
      }
      header {
        align-items: start;
      }
      .stage {
        min-height: 260px;
      }
      .timing span {
        display: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraceScreenshotPreviewComponent {
  readonly frames = input.required<ReadonlyArray<TraceScreenshotPreviewFrame>>();
  protected readonly navigator = createFrameNavigator({ frames: this.frames, key: (frame) => frame.file });
  protected readonly selectedIndex = this.navigator.selectedIndex;
  protected readonly currentFrame = this.navigator.current;

  protected select(index: number): void {
    this.navigator.select(index);
  }
  protected previous(): void {
    this.navigator.previous();
  }
  protected next(): void {
    this.navigator.next();
  }
  protected formatMilliseconds(value: number): string {
    return `${value.toFixed(1)} ms`;
  }
  protected frameAlt(offsetMilliseconds: number): string {
    return `Trace screenshot at ${this.formatMilliseconds(offsetMilliseconds)}`;
  }
}
