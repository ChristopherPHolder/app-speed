import { Component, computed, input } from '@angular/core';
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
          <viewer-details [details]='item' />
        }
      }
      @case ('opportunity') {
        TODO opportunity
      }
      @case ('screenshot') {
        TODO screenshot
      }
      @case ('table') {
        <viewer-table [tableDetails]='tableDetails()' />
      }
    }
  `,
  standalone: true,
  imports: [TableComponent],
})
export class DetailsComponent {
  details = input.required<Details | Details.Table | Details.List>();
  tableDetails = computed(() => this.details() as Details.Table);
  listDetails = computed<Details.List>(() => this.details() as Details.List);
}
