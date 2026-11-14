import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';

/** Marks a link or button shown in the footer navigation. Use a Material text button. */
@Directive({ selector: '[uiFooterLink]' })
export class FooterLinkDirective {}

/**
 * The site footer: a wrapping row of navigation links, such as the legal pages, and an optional note
 * projected without a slot. Place it after the shell's `<main>` so it appears on every page.
 */
@Component({
  selector: 'ui-footer',
  template: `
    <footer>
      <nav [attr.aria-label]="navigationLabel()"><ng-content select="[uiFooterLink]" /></nav>
      <div class="note"><ng-content /></div>
    </footer>
  `,
  styles: `
    footer {
      display: grid;
      justify-items: center;
      gap: var(--ui-space-1);
      padding: var(--ui-space-3) var(--ui-page-gutter) var(--ui-space-4);
      border-top: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-low);
      color: var(--mat-sys-on-surface-variant);
    }
    nav {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--ui-space-1);
    }
    .note {
      font: var(--mat-sys-body-small);
      text-align: center;
    }
    .note:empty {
      display: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  /** Accessible name of the footer navigation landmark. */
  readonly navigationLabel = input('Footer');
}
