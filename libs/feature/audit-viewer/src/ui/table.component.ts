import { Component, computed, input } from '@angular/core';
import Details from 'lighthouse/types/lhr/audit-details';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
import { JsonPipe, NgFor } from '@angular/common';
import { RoundPipe } from '../utils/round.pipe';
import { KibibytesPipe } from '../utils/kibibytes.pipe';

@Component({
  selector: 'viewer-table',
  template: `
    <table mat-table [dataSource]='dataSource()'>
      <tr mat-header-row *matHeaderRowDef='displayedColumns()'></tr>
      <tr mat-row *matRowDef='let row; columns: displayedColumns();'></tr>

      <ng-container *ngFor='let heading of headings()' [matColumnDef]='$any(heading.key)'>
        <th mat-header-cell *matHeaderCellDef>{{ heading.label }}</th>
        <td mat-cell *matCellDef='let item'>
          @switch (heading.valueType) {
            @case ('ms') {
              {{ item[$any(heading.key)] | round }} ms
            }
            @case ('bytes') {
              {{ item[$any(heading.key)] | kibibytes }} KiB
            }
            @case ('node') {
              -> TODO type node || {{ item.node.nodeLabel }} {{ item.node.snippet }}
            }
            @default {
              {{ item[$any(heading.key)] }}
            }
          }
        </td>
      </ng-container>
    </table>
  `,
  standalone: true,
  imports: [
    MatTable,
    MatHeaderRow,
    MatRow,
    MatHeaderRowDef,
    MatColumnDef,
    MatRowDef,
    JsonPipe,
    NgFor,
    MatHeaderCell,
    MatHeaderCellDef,
    MatCell,
    MatCellDef,
    RoundPipe,
    KibibytesPipe,
  ],
  styles: [`
      :host {
          display: block;
          overflow: scroll;
      }
    table {
        border: 1px solid var(--mat-table-row-item-outline-color);
        tr {
            td:not(:first-child), th:not(:first-child) {
                text-align: end;
            }
        }
        tr:nth-child(even) {
            background-color: #eee;
        }
    }
  `]
})
export class TableComponent {
  tableDetails = input.required<Details.Table>();
  readonly headings = computed(() => this.tableDetails().headings.filter(({key}) => key !== null));
  readonly dataSource = computed(() => this.tableDetails().items);
  readonly displayedColumns = computed(() => this.headings().map(({key}) => key));
}
