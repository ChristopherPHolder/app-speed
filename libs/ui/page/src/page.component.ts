import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type PageWidth = 'narrow' | 'medium' | 'wide' | 'full';

/**
 * The centred content column of a page. It owns the gutters and the maximum width so features don't
 * each pick their own. Place it inside the shell's `<main>`.
 */
@Component({
  selector: 'ui-page',
  template: `<ng-content />`,
  host: { '[attr.data-width]': 'width()' },
  styles: `
    :host {
      display: block;
      box-sizing: border-box;
      width: 100%;
      max-width: calc(var(--ui-page-max-width) + 2 * var(--ui-page-gutter));
      margin-inline: auto;
      padding: var(--ui-space-6) var(--ui-page-gutter) var(--ui-space-12);
    }
    :host([data-width='narrow']) {
      --ui-page-max-width: var(--ui-page-width-narrow);
    }
    :host([data-width='medium']) {
      --ui-page-max-width: var(--ui-page-width-medium);
    }
    :host([data-width='wide']) {
      --ui-page-max-width: var(--ui-page-width-wide);
    }
    :host([data-width='full']) {
      --ui-page-max-width: 100%;
    }
    @media (width >= 840px) {
      :host {
        padding-block: var(--ui-space-8) var(--ui-space-16);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageComponent {
  /** Narrow for reading and forms, medium for builders and settings, wide for tables and galleries. */
  readonly width = input<PageWidth>('wide');
}
