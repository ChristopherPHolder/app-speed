import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

/**
 * A card that navigates. The whole surface is one link: an icon tile, an optional overline, a heading,
 * the projected description and a call to action. Hover and focus show a state layer.
 */
@Component({
  selector: 'ui-link-card',
  imports: [MatIcon, RouterLink],
  template: `
    <a class="card" [routerLink]="link()">
      <span class="icon"
        ><mat-icon aria-hidden="true">{{ icon() }}</mat-icon></span
      >
      <span class="content">
        @if (overline(); as overline) {
          <span class="overline">{{ overline }}</span>
        }
        <strong class="heading">{{ heading() }}</strong>
        <span class="description"><ng-content /></span>
      </span>
      <span class="action">{{ action() }}<mat-icon aria-hidden="true">arrow_forward</mat-icon></span>
    </a>
  `,
  styles: `
    :host {
      display: block;
    }
    .card {
      position: relative;
      display: grid;
      box-sizing: border-box;
      height: 100%;
      padding: var(--ui-space-4);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-large);
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
      text-decoration: none;
      grid-template-rows: auto 1fr auto;
      gap: var(--ui-space-4);
    }
    .card::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: var(--mat-sys-on-surface);
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--ui-motion-duration-short3) var(--ui-motion-easing-standard);
    }
    .card:hover::before {
      opacity: var(--mat-sys-hover-state-layer-opacity);
    }
    .card:focus-visible {
      outline: 2px solid var(--mat-sys-primary);
      outline-offset: 2px;
    }
    .card:focus-visible::before {
      opacity: var(--mat-sys-focus-state-layer-opacity);
    }
    .card:active::before {
      opacity: var(--mat-sys-pressed-state-layer-opacity);
    }
    .icon {
      display: grid;
      width: var(--ui-space-12);
      height: var(--ui-space-12);
      border-radius: var(--mat-sys-corner-large);
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      place-items: center;
    }
    .content {
      display: grid;
      align-content: start;
      gap: var(--ui-space-2);
    }
    .overline {
      color: var(--mat-sys-primary);
      font: var(--mat-sys-label-medium);
    }
    .heading {
      font: var(--mat-sys-title-large);
    }
    .description {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }
    .action {
      display: flex;
      align-items: center;
      gap: var(--ui-space-2);
      color: var(--mat-sys-primary);
      font: var(--mat-sys-label-large);
    }
    @media (width >= 600px) {
      .card {
        padding: var(--ui-space-6);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .card::before {
        transition: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkCardComponent {
  /** Router link: a path or a commands array. */
  readonly link = input.required<string | readonly unknown[]>();
  /** Material icon name for the tile. */
  readonly icon = input.required<string>();
  readonly heading = input.required<string>();
  /** The call to action at the foot of the card. */
  readonly action = input.required<string>();
  readonly overline = input<string>();
}
