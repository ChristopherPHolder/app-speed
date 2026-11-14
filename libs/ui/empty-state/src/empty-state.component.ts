import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

/** Marks the action that gets a person out of the empty state. */
@Directive({ selector: '[uiEmptyStateActions]' })
export class EmptyStateActionsDirective {}

/**
 * Shown in place of content that isn't there: nothing created yet, nothing matching a filter, or
 * something that can't be shown. Says what would be here and, through the projected action, how to
 * get it.
 */
@Component({
  selector: 'ui-empty-state',
  imports: [MatIcon],
  template: `
    @if (icon(); as icon) {
      <span class="icon"
        ><mat-icon aria-hidden="true">{{ icon }}</mat-icon></span
      >
    }
    <strong class="heading">{{ heading() }}</strong>
    <div class="description"><ng-content /></div>
    <div class="actions"><ng-content select="[uiEmptyStateActions]" /></div>
  `,
  styles: `
    :host {
      display: grid;
      box-sizing: border-box;
      padding: var(--ui-space-12) var(--ui-space-6);
      color: var(--mat-sys-on-surface);
      text-align: center;
      justify-items: center;
      gap: var(--ui-space-2);
    }
    .icon {
      display: grid;
      width: var(--ui-space-12);
      height: var(--ui-space-12);
      margin-bottom: var(--ui-space-2);
      border-radius: var(--mat-sys-corner-large);
      background: var(--mat-sys-surface-container-high);
      color: var(--mat-sys-on-surface-variant);
      place-items: center;
    }
    .heading {
      font: var(--mat-sys-title-medium);
    }
    .description {
      max-width: 480px;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }
    .description:empty,
    .actions:empty {
      display: none;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      margin-top: var(--ui-space-2);
      gap: var(--ui-space-2);
      justify-content: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly heading = input.required<string>();
  /** Material icon name shown above the heading. */
  readonly icon = input<string>();
}
