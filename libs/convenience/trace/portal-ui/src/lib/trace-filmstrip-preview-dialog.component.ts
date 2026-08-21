import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import type { TraceFilmstripUiFrame } from './trace-filmstrip.component';

export interface TraceFilmstripPreviewData {
  readonly frames: ReadonlyArray<TraceFilmstripUiFrame>;
  readonly selectedIndex: number;
  readonly selectedIndexChange?: (index: number) => void;
}

@Component({
  selector: 'lib-trace-filmstrip-preview-dialog',
  imports: [MatDialogContent, MatDialogTitle, MatIcon, MatIconButton],
  template: `
    @if (frame(); as current) {
      <header>
        <h2 mat-dialog-title>Frame at {{ formatMilliseconds(current.offsetMilliseconds) }}</h2>
        <span>{{ selectedIndex() + 1 }} of {{ data.frames.length }}</span>
        <button
          mat-icon-button
          type="button"
          (click)="toggleExpanded()"
          [attr.aria-label]="expanded() ? 'Exit expanded preview' : 'Expand preview'"
        >
          <mat-icon>{{ expanded() ? 'fullscreen_exit' : 'fullscreen' }}</mat-icon>
        </button>
        <button mat-icon-button type="button" (click)="close()" aria-label="Close frame preview">
          <mat-icon>close</mat-icon>
        </button>
      </header>
      <mat-dialog-content>
        <button
          mat-icon-button
          type="button"
          (click)="previous()"
          [disabled]="selectedIndex() === 0"
          aria-label="Previous frame"
        >
          <mat-icon>chevron_left</mat-icon>
        </button>
        <img [src]="current.source" [alt]="'Trace frame at ' + formatMilliseconds(current.offsetMilliseconds)" />
        <button
          mat-icon-button
          type="button"
          (click)="next()"
          [disabled]="selectedIndex() === data.frames.length - 1"
          aria-label="Next frame"
        >
          <mat-icon>chevron_right</mat-icon>
        </button>
      </mat-dialog-content>
      <p class="shortcuts">Use Left and Right Arrow to navigate, F to expand, and Escape to close.</p>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    header {
      display: grid;
      grid-template-columns: 1fr auto auto auto;
      align-items: center;
      padding: 8px 8px 0 24px;
      gap: 4px;
    }
    h2 {
      margin: 0;
    }
    header > span {
      color: var(--mat-sys-on-surface-variant);
      font-variant-numeric: tabular-nums;
    }
    mat-dialog-content {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      min-width: min(76vw, 900px);
      align-items: center;
      padding: 16px 8px;
      background: #16181d;
    }
    img {
      display: block;
      width: 100%;
      max-height: 70vh;
      object-fit: contain;
    }
    .shortcuts {
      margin: 10px 24px 18px;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
    @media (max-width: 680px) {
      mat-dialog-content {
        min-width: 0;
      }
      .shortcuts {
        display: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraceFilmstripPreviewDialogComponent {
  protected readonly data = inject<TraceFilmstripPreviewData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TraceFilmstripPreviewDialogComponent>);
  protected readonly selectedIndex = signal(this.data.selectedIndex);
  protected readonly expanded = signal(false);
  protected readonly frame = () => this.data.frames[this.selectedIndex()];

  @HostListener('document:keydown', ['$event'])
  protected handleKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.close();
    else if (event.key === 'ArrowLeft') this.previous();
    else if (event.key === 'ArrowRight') this.next();
    else if (event.key.toLowerCase() === 'f') this.toggleExpanded();
  }

  protected previous(): void {
    this.selectIndex(Math.max(0, this.selectedIndex() - 1));
  }
  protected next(): void {
    this.selectIndex(Math.min(this.data.frames.length - 1, this.selectedIndex() + 1));
  }
  protected close(): void {
    this.dialogRef.close();
  }
  protected toggleExpanded(): void {
    this.expanded.update((value) => !value);
    this.dialogRef.updateSize(this.expanded() ? '100vw' : '', this.expanded() ? '100vh' : '');
  }
  protected formatMilliseconds(value: number): string {
    return `${value.toFixed(1)} ms`;
  }
  private selectIndex(index: number): void {
    this.selectedIndex.set(index);
    this.data.selectedIndexChange?.(index);
  }
}
