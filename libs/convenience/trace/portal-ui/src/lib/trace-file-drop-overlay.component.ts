import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'lib-trace-file-drop-overlay',
  imports: [MatIcon],
  template: `
    <div role="status">
      <mat-icon aria-hidden="true">file_download</mat-icon>
      <h2>{{ title() }}</h2>
      @if (description(); as description) {
        <p>{{ description }}</p>
      }
    </div>
  `,
  styles: `
    :host {
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
    div {
      padding: 40px;
    }
    mat-icon {
      width: 64px;
      height: 64px;
      color: var(--mat-sys-primary);
      font-size: 64px;
    }
    h2 {
      margin: 18px 0 6px;
      font: var(--mat-sys-headline-medium);
    }
    p {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-large);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraceFileDropOverlayComponent {
  readonly title = input('Drop to replace this trace');
  readonly description = input<string>();
}
