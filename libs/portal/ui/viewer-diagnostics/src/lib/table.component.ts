import { ChangeDetectionStrategy, Component, computed, effect, input, signal, untracked } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { ScrollContainerComponent } from '@app-speed/portal-ui/scroll-container';
import type Details from 'lighthouse/types/lhr/audit-details';
import { ViewerDetailValueComponent } from './detail-value.component';
import { buildTableBaseModel, buildVisibleRows, getDefaultShowThirdParty, TableBaseModel } from './table.adaptor';
import { ViewerDiagnosticContext } from './viewer-diagnostic.models';

@Component({
  selector: 'ui-viewer-table',
  template: `
    @if (filterState().enabled) {
      <div class="viewer-table__filter">
        <mat-checkbox [checked]="showThirdParty()" (change)="onShowThirdPartyChange($event.checked)">
          Show 3rd-party resources
        </mat-checkbox>
        <span class="viewer-table__filter-count">{{ filterState().thirdPartyCount }}</span>
      </div>
    }

    @if (rows().length) {
      <ui-scroll-container>
        <table mat-table [dataSource]="rows()" class="viewer-table">
          @for (column of columns(); track column.id) {
            <ng-container [matColumnDef]="column.id">
              <th mat-header-cell *matHeaderCellDef [class]="column.headerClassName" scope="col">
                {{ column.heading.label }}
              </th>

              <td
                mat-cell
                *matCellDef="let row"
                [class]="row.cells[column.index].className"
                [class.viewer-table__cell--empty]="row.cells[column.index].empty"
              >
                @let cell = row.cells[column.index];
                @if (!cell.empty) {
                  <div
                    class="viewer-table__cell-content"
                    [class.viewer-table__cell-content--group]="column.index === 0 && row.isGroup"
                  >
                    <ui-viewer-detail-value [value]="cell.value" [heading]="cell.heading" [context]="context()" />

                    @if (column.index === 0 && row.entityInfo; as entityInfo) {
                      @if (row.isGroup && entityInfo.category) {
                        <span class="viewer-table__adorn">{{ entityInfo.category }}</span>
                      }
                      @if (row.isGroup && entityInfo.isFirstParty) {
                        <span class="viewer-table__adorn viewer-table__adorn--first-party">1st party</span>
                      }
                      @if (row.isGroup && entityInfo.homepage) {
                        <a
                          class="viewer-table__external-link"
                          [href]="entityInfo.homepage"
                          target="_blank"
                          rel="noopener"
                          title="Open in a new tab"
                        >
                          ↗
                        </a>
                      }
                    }
                  </div>
                }
              </td>
            </ng-container>
          }

          <tr mat-header-row *matHeaderRowDef="displayedColumnIds(); sticky: true"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: displayedColumnIds()"
            class="viewer-table__row"
            [class.viewer-table__row--subitem]="row.isSubItem"
            [class.viewer-table__row--group]="row.isGroup"
            [class.viewer-table__row--entity-child]="row.indentLevel === 1 && !row.isSubItem"
            [class.viewer-table__row--entity-subitem]="row.indentLevel === 2"
            [class.viewer-table__row--even]="row.stripe === 'even'"
            [class.viewer-table__row--odd]="row.stripe === 'odd'"
          ></tr>
        </table>
      </ui-scroll-container>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .viewer-table__filter {
      display: inline-flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 12px;
    }

    .viewer-table__filter-count {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 0 10px;
      border-radius: 999px;
      background-color: #eef2f7;
      color: #465166;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .viewer-table {
      --mat-table-background-color: #faf9fd;
      --mat-table-row-item-outline-color: color-mix(in srgb, #74777f 32%, white);
      --mat-table-header-headline-color: #465166;
      width: 100%;
      min-width: 42rem;
      border: 1px solid var(--mat-table-row-item-outline-color);
      border-radius: 12px;
      overflow: hidden;
      background: var(--mat-table-background-color);
    }

    .viewer-table :is(.mat-mdc-header-row, .mat-mdc-header-cell) {
      background-color: #eef2f7;
    }

    .viewer-table :is(.mat-mdc-header-cell, .mat-mdc-cell) {
      padding: 12px;
    }

    .viewer-table .mat-mdc-header-cell {
      text-align: left;
      box-shadow: inset 0 -1px 0 var(--mat-table-row-item-outline-color);
    }

    .viewer-table :is(.mat-mdc-header-row, .mat-mdc-row) {
      height: auto;
    }

    .viewer-table .mat-mdc-row:last-child .mat-mdc-cell {
      border-bottom: 0;
    }

    .viewer-table__header-cell--metric {
      text-align: center;
    }

    .viewer-table__row--group {
      background-color: #eef2f7;
    }

    .viewer-table__row--group .mat-mdc-cell {
      font-size: 1.05em;
      font-weight: 700;
    }

    .viewer-table__row--group .mat-mdc-cell:first-child {
      min-width: max-content;
      font-weight: 400;
    }

    .viewer-table__row--even {
      background-color: #f6f8fb;
    }

    .viewer-table__row--subitem .mat-mdc-cell {
      padding-top: 8px;
      padding-bottom: 8px;
      color: #5f6878;
    }

    .viewer-table__row--subitem .mat-mdc-cell:first-child,
    .viewer-table__row--entity-child .mat-mdc-cell:first-child {
      padding-left: 24px;
    }

    .viewer-table__row--entity-subitem .mat-mdc-cell:first-child {
      display: block;
      margin-left: 20px;
      padding-left: 10px;
      border-left: 1px solid #9eb8e0;
    }

    .viewer-table__cell-content {
      display: block;
    }

    .viewer-table__cell-content--group {
      display: inline-flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .viewer-table__adorn {
      display: inline-flex;
      align-items: center;
      padding: 2px 6px;
      border: 1px solid color-mix(in srgb, var(--mat-sys-outline) 70%, white);
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: capitalize;
      color: #5f6878;
    }

    .viewer-table__adorn--first-party {
      border-color: #7a9ccf;
      color: #2259a8;
    }

    .viewer-table__external-link {
      color: inherit;
      text-decoration: none;
      opacity: 0.72;
    }

    .viewer-table__external-link:hover {
      text-decoration: underline;
    }

    .viewer-table__cell--bytes,
    .viewer-table__cell--ms,
    .viewer-table__cell--numeric,
    .viewer-table__cell--timespanMs {
      text-align: right;
      white-space: nowrap;
    }

    .viewer-table__column--narrow {
      width: 12%;
      min-width: 8.5rem;
    }

    .viewer-table__cell--url {
      min-width: 16rem;
    }

    .viewer-table__cell--code {
      min-width: 18rem;
    }

    .viewer-table__cell--empty {
      background: transparent;
    }
  `,
  imports: [MatCheckboxModule, MatTableModule, ScrollContainerComponent, ViewerDetailValueComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerTableComponent {
  tableDetails = input.required<Details.Table | Details.Opportunity>();
  auditId = input<string | null>(null);
  context = input<ViewerDiagnosticContext | null>(null);

  readonly showThirdParty = signal(true);

  readonly tableModel = computed<TableBaseModel>(() =>
    buildTableBaseModel({
      details: this.tableDetails(),
      auditId: this.auditId(),
      context: this.context(),
    }),
  );
  readonly columns = computed(() => this.tableModel().columns);
  readonly filterState = computed(() => this.tableModel().filterState);
  readonly rows = computed(() =>
    buildVisibleRows({
      bundles: this.tableModel().bundles,
      filterState: this.filterState(),
      showThirdParty: this.showThirdParty(),
      usesEntityGrouping: this.tableModel().usesEntityGrouping,
    }),
  );
  readonly displayedColumnIds = computed(() => this.columns().map((column) => column.id));

  constructor() {
    effect(() => {
      const defaultValue = getDefaultShowThirdParty(this.auditId(), this.filterState());
      untracked(() => this.showThirdParty.set(defaultValue));
    });
  }

  onShowThirdPartyChange(checked: boolean): void {
    this.showThirdParty.set(checked);
  }
}
