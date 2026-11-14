import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PageComponent } from '@app-speed/ui/page';
import { PageHeaderComponent } from '@app-speed/ui/page-header';
import { ProseComponent } from '@app-speed/ui/prose';
import { legalLastUpdated } from './operator';

/** The reading layout shared by the legal notice, privacy policy and terms. */
@Component({
  selector: 'app-legal-page',
  imports: [PageComponent, PageHeaderComponent, ProseComponent],
  template: `
    <ui-page width="narrow">
      <ui-page-header [heading]="heading()" [description]="'Last updated ' + lastUpdated" />
      <ui-prose><ng-content /></ui-prose>
    </ui-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalPageComponent {
  readonly heading = input.required<string>();
  protected readonly lastUpdated = legalLastUpdated;
}
