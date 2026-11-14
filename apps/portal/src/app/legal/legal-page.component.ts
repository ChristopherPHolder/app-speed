import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { PageComponent } from '@app-speed/ui/page';
import { PageHeaderComponent } from '@app-speed/ui/page-header';
import { legalLastUpdated } from './operator';

/** The reading layout shared by the legal notice, privacy policy and terms. */
@Component({
  selector: 'app-legal-page',
  imports: [PageComponent, PageHeaderComponent],
  template: `
    <ui-page width="narrow">
      <ui-page-header [heading]="heading()" [description]="'Last updated ' + lastUpdated" />
      <article class="legal-prose"><ng-content /></article>
    </ui-page>
  `,
  // Projected prose belongs to the page components, so these rules must reach it unscoped.
  encapsulation: ViewEncapsulation.None,
  styles: `
    .legal-prose {
      margin-top: var(--ui-space-6);
      font: var(--mat-sys-body-large);
      color: var(--mat-sys-on-surface);
    }
    .legal-prose h2 {
      margin: var(--ui-space-10) 0 var(--ui-space-3);
      font: var(--mat-sys-title-large);
    }
    .legal-prose h3 {
      margin: var(--ui-space-6) 0 var(--ui-space-2);
      font: var(--mat-sys-title-medium);
    }
    .legal-prose p,
    .legal-prose ul,
    .legal-prose dl,
    .legal-prose address {
      margin: 0 0 var(--ui-space-4);
    }
    .legal-prose address {
      font-style: normal;
    }
    .legal-prose li + li {
      margin-top: var(--ui-space-2);
    }
    .legal-prose dt {
      font: var(--mat-sys-title-small);
    }
    .legal-prose dd {
      margin: 0 0 var(--ui-space-3);
    }
    .legal-prose a {
      color: var(--mat-sys-primary);
      overflow-wrap: anywhere;
    }
    .legal-prose .table-scroll {
      overflow-x: auto;
      margin-bottom: var(--ui-space-4);
    }
    .legal-prose table {
      width: 100%;
      border-collapse: collapse;
      font: var(--mat-sys-body-medium);
    }
    .legal-prose th,
    .legal-prose td {
      padding: var(--ui-space-2) var(--ui-space-3);
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      text-align: start;
      vertical-align: top;
    }
    .legal-prose th {
      font: var(--mat-sys-title-small);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalPageComponent {
  readonly heading = input.required<string>();
  protected readonly lastUpdated = legalLastUpdated;
}
