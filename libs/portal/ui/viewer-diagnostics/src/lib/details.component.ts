import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type Details from 'lighthouse/types/lhr/audit-details';
import { ViewerTableComponent } from './table.component';

@Component({
  selector: 'ui-viewer-details',
  template: `
    @switch (details().type) {
      @case ('debugdata') {
        TODO debugdata
      }
      @case ('criticalrequestchain') {
        TODO criticalrequestchain
      }
      @case ('treemap-data') {
        TODO treemap-data
      }
      @case ('filmstrip') {
        TODO filmstrip
      }
      @case ('list') {
        @for (item of listDetails().items; track $index) {
          <ui-viewer-details [details]="$any(item)" />
        }
      }
      @case ('opportunity') {
        <ui-viewer-table [tableDetails]="tableDetails()" />
      }
      @case ('screenshot') {
        TODO screenshot
      }
      @case ('table') {
        <ui-viewer-table [tableDetails]="tableDetails()" />
      }
    }
  `,
  imports: [ViewerTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerDetailsComponent {
  details = input.required<Details | Details.Table | Details.List | Details.DebugData>();
  readonly tableDetails = computed(() => this.details() as Details.Table);
  readonly listDetails = computed<Details.List>(() => this.details() as Details.List);
}
