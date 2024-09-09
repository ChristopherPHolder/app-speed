import { ChangeDetectionStrategy, Component, computed, input, OnInit } from '@angular/core';
import Details from 'lighthouse/types/lhr/audit-details';
import { TableComponent } from './table.component';
// import { ScrollContainerComponent } from '@app-speed/ui/scroll-container';
// import {
//   MatCell,
//   MatCellDef,
//   MatColumnDef,
//   MatHeaderCell,
//   MatHeaderCellDef,
//   MatHeaderRow,
//   MatHeaderRowDef,
//   MatRow,
//   MatRowDef,
//   MatTable,
// } from '@angular/material/table';
// import { CdkTableDataSourceInput } from '@angular/cdk/table';
// import { KibibytesPipe } from '../utils/kibibytes.pipe';
// import { NgForOf } from '@angular/common';
// import { RoundPipe } from '../utils/round.pipe';
import { DetailsRenderer } from 'lighthouse/report/renderer/details-renderer';
import { DOM } from 'lighthouse/report/renderer/dom';

// @Component({
//   selector: 'viewer-details-opportunities',
//   template: `
//     <ui-scroll-container>
//       <table mat-table [dataSource]="dataSource()"></table>
//       <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
//       <tr mat-row *matRowDef="let row; columns: displayedColumns()"></tr>
//       @for (heading of headings(); track heading.key) {
//         @if (heading.key) {
//           <ng-container [matColumnDef]="heading.key">
//             <th mat-header-cell *matHeaderCellDef>{{ heading.label }}</th>
//             <td mat-cell *matCellDef="let item">
//               @switch (heading.valueType) {
//                 @case ('ms') {
//                   {{ item[heading.key] | round }}
//                 }
//                 @case ('bytes') {
//                   {{ item[heading.key] | kibibytes }}
//                 }
//                 @case ('node') {
//                   -> TODO
//                 }
//                 @default {
//                   {{ item[heading.key] }}
//                 }
//               }
//             </td>
//           </ng-container>
//         }
//       }
//     </ui-scroll-container>
//   `,
//   standalone: true,
//   imports: [
//     TableComponent,
//     ScrollContainerComponent,
//     MatTable,
//     MatHeaderCellDef,
//     MatHeaderRow,
//     MatHeaderRowDef,
//     MatRow,
//     MatRowDef,
//     KibibytesPipe,
//     MatCell,
//     MatCellDef,
//     MatHeaderCell,
//     NgForOf,
//     RoundPipe,
//     MatColumnDef,
//   ],
// })
// export class ViewerDetailsOpportunitiesComponent {
//   details = input.required<Details.Opportunity>();
//   readonly dataSource = computed<CdkTableDataSourceInput<Details.OpportunityItem>>(() => this.details().items);
//   readonly headings = computed(() => this.details().headings.filter(({ key }) => key !== null));
//   readonly displayedColumns = computed(() => this.headings().map(({ key }) => key));
// }

@Component({
  selector: 'viewer-details',
  template: `
    <!--    @switch (details().type) {-->
    <!--      @case ('debugdata') {-->
    <!--        TODO debugdata-->
    <!--      }-->
    <!--      @case ('criticalrequestchain') {-->
    <!--        TODO criticalrequestchain-->
    <!--      }-->
    <!--      @case ('treemap-data') {-->
    <!--        TODO treemap-data-->
    <!--      }-->
    <!--      @case ('filmstrip') {-->
    <!--        TODO filmstrip-->
    <!--      }-->
    <!--      @case ('list') {-->
    <!--        @for (item of listDetails().items; track $index) {-->
    <!--          <viewer-details [details]="item" />-->
    <!--        }-->
    <!--      }-->
    <!--      @case ('opportunity') {-->
    <!--        <viewer-table [tableDetails]="tableDetails()" />-->
    <!--      }-->
    <!--      @case ('screenshot') {-->
    <!--        TODO screenshot-->
    <!--      }-->
    <!--      @case ('table') {-->
    <!--        <viewer-table [tableDetails]="tableDetails()" />-->
    <!--      }-->
    <!--    }-->
  `,
  standalone: true,
  imports: [TableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailsComponent implements OnInit {
  details = input.required<Details | Details.Table | Details.List>();
  tableDetails = computed(() => this.details() as Details.Table);
  listDetails = computed<Details.List>(() => this.details() as Details.List);
  detailsRenderer = new DetailsRenderer(new DOM(document, document.body));

  ngOnInit(): void {
    console.log(this.details());
    const i = this.detailsRenderer.render(this.details());
    console.log('element', i);
  }
}
