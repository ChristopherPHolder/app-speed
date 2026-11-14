import { ChangeDetectionStrategy, Component, computed, effect, input, signal, untracked } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ScrollContainerComponent } from '@app-speed/ui/scroll-container';
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
                  @if (column.index > 0 && column.heading.label) {
                    <span class="viewer-table__cell-label" aria-hidden="true">{{ column.heading.label }}</span>
                  }
                  <div
                    class="viewer-table__cell-content"
                    [class.viewer-table__cell-content--group]="column.index === 0 && row.isGroup"
                  >
                    <ui-viewer-detail-value
                      [value]="cell.value"
                      [heading]="cell.heading"
                      [context]="context()"
                      [previewUrl]="cell.previewUrl"
                      [parentUrl]="cell.parentUrl"
                    />

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
                          [attr.aria-label]="entityInfo.name + ' homepage (opens in a new tab)'"
                          title="Open in a new tab"
                        >
                          <mat-icon [inline]="true" aria-hidden="true">open_in_new</mat-icon>
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
    /* The layout follows the width the table actually has, not the window: it can sit in a narrow column. */
    :host {
      display: block;
      container: viewer-table / inline-size;
    }

    .viewer-table__filter {
      display: inline-flex;
      gap: var(--ui-space-3);
      align-items: center;
      margin-bottom: var(--ui-space-3);
    }

    .viewer-table__filter-count {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 0 10px;
      border-radius: var(--mat-sys-corner-full);
      background-color: var(--mat-sys-surface-container-high);
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-medium);
    }

    .viewer-table {
      --mat-table-background-color: var(--mat-sys-surface-container-lowest);
      --mat-table-row-item-outline-color: var(--mat-sys-outline-variant);
      --mat-table-header-headline-color: var(--mat-sys-on-surface-variant);
      width: 100%;
      border: 1px solid var(--mat-table-row-item-outline-color);
      border-radius: var(--mat-sys-corner-medium);
      overflow: hidden;
      background: var(--mat-table-background-color);
    }

    .viewer-table :is(.mat-mdc-header-row, .mat-mdc-header-cell) {
      background-color: var(--mat-sys-surface-container-low);
    }

    .viewer-table :is(.mat-mdc-header-cell, .mat-mdc-cell) {
      padding: var(--ui-space-3);
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
      background-color: var(--mat-sys-surface-container);
    }

    .viewer-table__row--group .mat-mdc-cell {
      font-weight: 500;
    }

    .viewer-table__row--group .mat-mdc-cell:first-child {
      font-weight: 400;
    }

    .viewer-table__row--subitem .mat-mdc-cell {
      padding-top: var(--ui-space-2);
      padding-bottom: var(--ui-space-2);
      color: var(--mat-sys-on-surface-variant);
    }

    .viewer-table__cell-label {
      display: none;
    }

    .viewer-table__cell-content {
      display: block;
    }

    .viewer-table__cell-content--group {
      display: inline-flex;
      gap: var(--ui-space-2);
      align-items: center;
      flex-wrap: wrap;
    }

    .viewer-table__adorn {
      display: inline-flex;
      align-items: center;
      padding: 2px 6px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-full);
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-medium);
      text-transform: capitalize;
    }

    .viewer-table__adorn--first-party {
      border-color: var(--mat-sys-primary);
      color: var(--mat-sys-primary);
    }

    .viewer-table__external-link {
      display: inline-flex;
      color: var(--mat-sys-on-surface-variant);
      text-decoration: none;
    }

    .viewer-table__external-link:hover {
      color: var(--mat-sys-primary);
    }

    .viewer-table__cell--bytes,
    .viewer-table__cell--ms,
    .viewer-table__cell--numeric,
    .viewer-table__cell--timespanMs {
      text-align: right;
      white-space: nowrap;
    }

    .viewer-table__cell--empty {
      background: transparent;
    }

    /* Medium and wider: a real table, scrolled sideways when the columns need more room than there is. */
    @container viewer-table (width >= 600px) {
      .viewer-table {
        min-width: 42rem;
      }

      .viewer-table__row--group .mat-mdc-cell:first-child {
        min-width: max-content;
      }

      .viewer-table__row--subitem .mat-mdc-cell:first-child,
      .viewer-table__row--entity-child .mat-mdc-cell:first-child {
        padding-left: var(--ui-space-6);
      }

      .viewer-table__row--entity-subitem .mat-mdc-cell:first-child {
        display: block;
        margin-left: var(--ui-space-5);
        padding-left: 10px;
        border-left: 1px solid var(--mat-sys-outline);
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
    }

    /*
     * Compact: each row becomes a stacked item so every column stays on screen. The first column is the row's
     * title; the others follow as label-value lines. Sub-items hang off their parent on an indented rule. The
     * header row is kept for assistive technology but hidden.
     */
    @container viewer-table (width < 600px) {
      /*
       * MatTable renders thead and tbody in its own template, out of reach of these styles. As flex items they
       * are blockified, so the rows below lay out as plain blocks instead of inside an anonymous table.
       */
      .viewer-table {
        display: flex;
        flex-direction: column;
        /* The scroll container sizes its content to fit; pin the table to the width there is instead. */
        max-width: 100cqi;
      }

      /* Visually hidden. CdkTable sets the sticky position inline, so this can't take the row out of flow. */
      .viewer-table .mat-mdc-header-row {
        display: block;
        height: 1px;
        margin-bottom: -1px;
        overflow: hidden;
        clip-path: inset(50%);
      }

      .viewer-table .mat-mdc-row {
        display: flex;
        flex-direction: column;
        gap: var(--ui-space-1);
        padding: var(--ui-space-3) var(--ui-space-4);
        border-bottom: 1px solid var(--mat-table-row-item-outline-color);
      }

      .viewer-table .mat-mdc-row:last-child {
        border-bottom: 0;
      }

      /* A label above its value by default, so long values (code, elements, messages) get the full width. */
      .viewer-table .mat-mdc-cell {
        display: flex;
        flex-direction: column;
        gap: var(--ui-space-1);
        min-width: 0;
        padding: 0;
        border: 0;
        text-align: start;
        white-space: normal;
      }

      /* Numbers are short: label and value share a line, the value at the end like the table's own column. */
      .viewer-table
        :is(
          .viewer-table__cell--bytes,
          .viewer-table__cell--ms,
          .viewer-table__cell--numeric,
          .viewer-table__cell--timespanMs
        ) {
        flex-direction: row;
        gap: var(--ui-space-3);
        align-items: baseline;
        justify-content: space-between;
      }

      .viewer-table .viewer-table__cell--empty {
        display: none;
      }

      .viewer-table__cell-label {
        display: block;
        flex: none;
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-label-medium);
      }

      .viewer-table__cell-content {
        min-width: 0;
        max-width: 100%;
      }

      .viewer-table__row--entity-child {
        padding-inline-start: var(--ui-space-6);
      }

      .viewer-table .viewer-table__row--subitem {
        margin-inline-start: var(--ui-space-6);
        padding: var(--ui-space-2) var(--ui-space-4) var(--ui-space-2) var(--ui-space-3);
        border-inline-start: 1px solid var(--mat-sys-outline);
      }

      .viewer-table .viewer-table__row--entity-subitem {
        margin-inline-start: var(--ui-space-8);
      }
    }
  `,
  imports: [MatCheckboxModule, MatIconModule, MatTableModule, ScrollContainerComponent, ViewerDetailValueComponent],
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
