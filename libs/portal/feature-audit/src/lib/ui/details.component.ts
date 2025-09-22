import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import Details from 'lighthouse/types/lhr/audit-details';
import { TableComponent } from './table.component';

@Component({
  selector: 'viewer-details',
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
          <!-- TODO fix change after type change in lighthouse -->
          <viewer-details [details]="$any(item)" />
        }
      }
      @case ('opportunity') {
        <viewer-table [tableDetails]="tableDetails()" />
      }
      @case ('screenshot') {
        TODO screenshot
      }
      @case ('table') {
        <viewer-table [tableDetails]="tableDetails()" />
      }
    }
  `,
  imports: [TableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailsComponent {
  // TODO fix after type change in lighthouse
  details = input.required<Details | Details.Table | Details.List | Details.DebugData>();
  tableDetails = computed(() => this.details() as Details.Table);
  listDetails = computed<Details.List>(() => this.details() as Details.List);
}
