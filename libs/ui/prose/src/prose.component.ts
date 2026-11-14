import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Typography for long-form reading content written as plain HTML, such as legal pages and guides:
 * headings, paragraphs, lists, definition lists, addresses, links and tables. Wrap a table in
 * `.ui-prose-table` so it scrolls sideways on narrow screens instead of widening the page.
 */
@Component({
  selector: 'ui-prose',
  template: `<ng-content />`,
  // The content is projected from the consumer, so these rules are scoped by the host element instead.
  encapsulation: ViewEncapsulation.None,
  styles: `
    ui-prose {
      display: block;
      font: var(--mat-sys-body-large);
      color: var(--mat-sys-on-surface);
    }
    ui-prose h2 {
      margin: var(--ui-space-10) 0 var(--ui-space-3);
      font: var(--mat-sys-title-large);
    }
    ui-prose h3 {
      margin: var(--ui-space-6) 0 var(--ui-space-2);
      font: var(--mat-sys-title-medium);
    }
    ui-prose > :first-child {
      margin-top: 0;
    }
    ui-prose :is(p, ul, ol, dl, address) {
      margin: 0 0 var(--ui-space-4);
    }
    ui-prose address {
      font-style: normal;
    }
    ui-prose li + li {
      margin-top: var(--ui-space-2);
    }
    ui-prose dt {
      font: var(--mat-sys-title-small);
    }
    ui-prose dd {
      margin: 0 0 var(--ui-space-3);
    }
    ui-prose a {
      color: var(--mat-sys-primary);
      overflow-wrap: anywhere;
    }
    ui-prose .ui-prose-table {
      overflow-x: auto;
      margin-bottom: var(--ui-space-4);
    }
    ui-prose table {
      width: 100%;
      border-collapse: collapse;
      font: var(--mat-sys-body-medium);
    }
    ui-prose :is(th, td) {
      padding: var(--ui-space-2) var(--ui-space-3);
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      text-align: start;
      vertical-align: top;
    }
    ui-prose th {
      font: var(--mat-sys-title-small);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProseComponent {}
