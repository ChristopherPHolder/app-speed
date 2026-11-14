import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';

export type PageHeaderProminence = 'standard' | 'hero';

/** Marks the back link or breadcrumbs shown above the heading. */
@Directive({ selector: '[uiPageHeaderNavigation]' })
export class PageHeaderNavigationDirective {}

/** Marks the actions that belong to the page, shown beside the heading. */
@Directive({ selector: '[uiPageHeaderActions]' })
export class PageHeaderActionsDirective {}

/** Marks supporting content shown beside a hero header from the expanded window class. */
@Directive({ selector: '[uiPageHeaderAside]' })
export class PageHeaderAsideDirective {}

/**
 * The title block of a page: optional navigation, eyebrow, the page's `h1`, a description and actions.
 * `hero` prominence sets it on a tonal panel with display type, for landing-style pages.
 * Content projected without a slot is placed under the description.
 */
@Component({
  selector: 'ui-page-header',
  template: `
    <ng-content select="[uiPageHeaderNavigation]" />
    <header class="header">
      <div class="title">
        @if (eyebrow(); as eyebrow) {
          <p class="ui-eyebrow">{{ eyebrow }}</p>
        }
        <h1 [attr.id]="headingId()">{{ heading() }}</h1>
        @if (description(); as description) {
          <p class="description">{{ description }}</p>
        }
        <ng-content />
      </div>
      <div class="actions"><ng-content select="[uiPageHeaderActions]" /></div>
      <div class="aside"><ng-content select="[uiPageHeaderAside]" /></div>
    </header>
  `,
  host: { '[attr.data-prominence]': 'prominence()' },
  styles: `
    :host {
      display: block;
      margin-bottom: var(--ui-space-6);
    }
    .header {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ui-space-4) var(--ui-space-6);
      align-items: flex-end;
      justify-content: space-between;
    }
    .title {
      display: grid;
      flex: 1 1 320px;
      gap: var(--ui-space-2);
      min-width: 0;
    }
    h1 {
      margin: 0;
      color: var(--mat-sys-on-surface);
      font: var(--mat-sys-headline-small);
      overflow-wrap: anywhere;
      text-wrap: balance;
    }
    .description {
      max-width: var(--ui-page-width-narrow);
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-large);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ui-space-2);
      align-items: center;
    }
    .actions:empty,
    .aside:empty {
      display: none;
    }
    :host([data-prominence='hero']) .header {
      align-items: center;
      padding: var(--ui-space-6);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-extra-large);
      background: var(--mat-sys-surface-container-low);
    }
    :host([data-prominence='hero']) .title {
      flex-basis: 100%;
      gap: var(--ui-space-4);
    }
    :host([data-prominence='hero']) h1 {
      max-width: 760px;
      font: var(--mat-sys-headline-large);
    }
    :host([data-prominence='hero']) .aside {
      flex: 1 1 100%;
      min-width: 0;
    }
    @media (width >= 600px) {
      h1 {
        font: var(--mat-sys-headline-medium);
      }
      :host([data-prominence='hero']) .header {
        padding: var(--ui-space-8);
      }
      :host([data-prominence='hero']) h1 {
        font: var(--mat-sys-display-small);
      }
    }
    @media (width >= 840px) {
      :host {
        margin-bottom: var(--ui-space-8);
      }
      :host([data-prominence='hero']) .header {
        flex-wrap: nowrap;
        gap: var(--ui-space-12);
        padding: var(--ui-space-12);
      }
      :host([data-prominence='hero']) .title {
        flex: 1 1 0;
      }
      :host([data-prominence='hero']) .aside {
        flex: 0 1 380px;
      }
      :host([data-prominence='hero']) h1 {
        font: var(--mat-sys-display-medium);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  readonly heading = input.required<string>();
  readonly eyebrow = input<string>();
  readonly description = input<string>();
  /** Id of the `h1`, so a region can point at it with `aria-labelledby`. */
  readonly headingId = input<string>();
  readonly prominence = input<PageHeaderProminence>('standard');
}
