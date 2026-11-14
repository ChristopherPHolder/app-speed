import { ChangeDetectionStrategy, Component, Directive, computed, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

export type MessageTone = 'info' | 'success' | 'warning' | 'error';

const TONE_ICON: Record<MessageTone, string> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
};

/** Marks the actions shown at the end of a message. */
@Directive({ selector: '[uiMessageActions]' })
export class MessageActionsDirective {}

/**
 * An inline message that belongs to a region of the page: an error, a warning, a note. Errors are
 * announced assertively and the other tones politely. Set `announce` to false for a message that is
 * part of the page from the start and should not interrupt.
 */
@Component({
  selector: 'ui-message',
  imports: [MatIcon],
  template: `
    <mat-icon class="icon" aria-hidden="true">{{ resolvedIcon() }}</mat-icon>
    <div class="body">
      @if (heading(); as heading) {
        <strong class="heading">{{ heading }}</strong>
      }
      <div class="content"><ng-content /></div>
    </div>
    <div class="actions"><ng-content select="[uiMessageActions]" /></div>
  `,
  host: {
    '[attr.data-tone]': 'tone()',
    '[attr.role]': 'role()',
  },
  styles: `
    :host {
      --ui-message-container: var(--mat-sys-surface-container-high);
      --ui-message-content: var(--mat-sys-on-surface);
      --ui-message-accent: var(--mat-sys-primary);
      display: flex;
      box-sizing: border-box;
      padding: var(--ui-space-3) var(--ui-space-4);
      border-radius: var(--mat-sys-corner-medium);
      background: var(--ui-message-container);
      color: var(--ui-message-content);
      font: var(--mat-sys-body-medium);
      align-items: flex-start;
      gap: var(--ui-space-3);
    }
    :host([data-tone='success']) {
      --ui-message-container: var(--ui-success-container);
      --ui-message-content: var(--ui-on-success-container);
      --ui-message-accent: var(--ui-on-success-container);
    }
    :host([data-tone='warning']) {
      --ui-message-container: var(--ui-warning-container);
      --ui-message-content: var(--ui-on-warning-container);
      --ui-message-accent: var(--ui-on-warning-container);
    }
    :host([data-tone='error']) {
      --ui-message-container: var(--mat-sys-error-container);
      --ui-message-content: var(--mat-sys-on-error-container);
      --ui-message-accent: var(--mat-sys-on-error-container);
    }
    .icon {
      flex: none;
      color: var(--ui-message-accent);
    }
    .body {
      display: grid;
      flex: 1 1 auto;
      gap: var(--ui-space-1);
      min-width: 0;
      /* Centre a single line against the 24dp icon. */
      padding-block: 2px;
      overflow-wrap: anywhere;
    }
    .heading {
      font: var(--mat-sys-title-small);
    }
    .actions {
      display: flex;
      flex: none;
      gap: var(--ui-space-2);
      align-items: center;
    }
    .actions:empty {
      display: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageComponent {
  readonly tone = input<MessageTone>('info');
  readonly heading = input<string>();
  /** Overrides the icon that goes with the tone. */
  readonly icon = input<string>();
  /** Whether assistive technology is told when the message appears. */
  readonly announce = input(true);

  protected readonly resolvedIcon = computed(() => this.icon() ?? TONE_ICON[this.tone()]);
  protected readonly role = computed(() => {
    if (!this.announce()) return null;
    return this.tone() === 'error' ? 'alert' : 'status';
  });
}
