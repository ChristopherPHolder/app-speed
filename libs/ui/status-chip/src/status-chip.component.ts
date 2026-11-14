import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

/**
 * A read-only status label. The tone sets the colour pair; the label, and an icon where given, carry
 * the meaning so it never depends on colour alone. `busy` swaps the icon for a progress indicator.
 */
@Component({
  selector: 'ui-status-chip',
  imports: [MatIcon, MatProgressSpinner],
  template: `
    @if (busy()) {
      <mat-spinner class="indicator" diameter="14" strokeWidth="2" aria-hidden="true" />
    } @else if (icon(); as icon) {
      <mat-icon class="indicator" aria-hidden="true">{{ icon }}</mat-icon>
    }
    <span class="label"><ng-content /></span>
  `,
  host: { '[attr.data-tone]': 'tone()' },
  styles: `
    :host {
      --ui-status-chip-container: var(--mat-sys-surface-container-high);
      --ui-status-chip-content: var(--mat-sys-on-surface-variant);
      display: inline-flex;
      box-sizing: border-box;
      max-width: 100%;
      min-height: var(--ui-space-6);
      padding: var(--ui-space-1) var(--ui-space-2);
      border-radius: var(--mat-sys-corner-small);
      background: var(--ui-status-chip-container);
      color: var(--ui-status-chip-content);
      font: var(--mat-sys-label-medium);
      align-items: center;
      gap: var(--ui-space-1);
      vertical-align: middle;
    }
    :host([data-tone='info']) {
      --ui-status-chip-container: var(--mat-sys-primary-container);
      --ui-status-chip-content: var(--mat-sys-on-primary-container);
    }
    :host([data-tone='success']) {
      --ui-status-chip-container: var(--ui-success-container);
      --ui-status-chip-content: var(--ui-on-success-container);
    }
    :host([data-tone='warning']) {
      --ui-status-chip-container: var(--ui-warning-container);
      --ui-status-chip-content: var(--ui-on-warning-container);
    }
    :host([data-tone='error']) {
      --ui-status-chip-container: var(--mat-sys-error-container);
      --ui-status-chip-content: var(--mat-sys-on-error-container);
    }
    .label {
      white-space: nowrap;
    }
    .indicator {
      flex: none;
    }
    mat-icon.indicator {
      width: var(--ui-space-4);
      height: var(--ui-space-4);
      font-size: var(--ui-space-4);
    }
    mat-spinner.indicator {
      --mat-progress-spinner-active-indicator-color: currentColor;
      margin-inline: 1px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusChipComponent {
  readonly tone = input<StatusTone>('neutral');
  /** Material icon name shown before the label. */
  readonly icon = input<string>();
  /** Shows a progress indicator instead of the icon. */
  readonly busy = input(false);
}
