import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
  untracked,
} from '@angular/core';
import { ScrollContainerComponent } from '@app-speed/portal-ui/scroll-container';
import type Details from 'lighthouse/types/lhr/audit-details';
import type Result from 'lighthouse/types/lhr/lhr';
import { ViewerDetailValueComponent } from './detail-value.component';
import { ViewerDiagnosticContext } from './viewer-diagnostic.models';

type Heading = Details.TableColumnHeading | null;
type EntityInfo = Result.Entities[number];
type TableItemWithEntity = Details.TableItem & { entity?: string };

type RenderRow = {
  key: string;
  isSubItem: boolean;
  isGroup: boolean;
  indentLevel: 0 | 1 | 2;
  entityName?: string;
  entityInfo?: EntityInfo;
  cells: { heading: Heading; value: Details.ItemValue | undefined }[];
};

type RowBundle = {
  key: string;
  thirdParty: boolean;
  countable: boolean;
  rows: RenderRow[];
};

type FilterState = {
  enabled: boolean;
  mixed: boolean;
  thirdPartyCount: number;
};

const FILTER_EXCLUDED_AUDITS = new Set([
  'uses-rel-preconnect',
  'third-party-facades',
  'network-dependency-tree-insight',
]);

const FILTER_HIDE_BY_DEFAULT_AUDITS = new Set([
  'legacy-javascript',
  'legacy-javascript-insight',
]);

const SUMMABLE_VALUE_TYPES = new Set<Details.TableColumnHeading['valueType']>([
  'bytes',
  'numeric',
  'ms',
  'timespanMs',
]);

@Component({
  selector: 'ui-viewer-table',
  template: `
    @if (filterState().enabled) {
      <label class="viewer-table__filter">
        <input
          type="checkbox"
          [checked]="showThirdParty()"
          (change)="onShowThirdPartyChange($any($event.target).checked)"
        />
        <span>Show 3rd-party resources</span>
        <span class="viewer-table__filter-count">{{ filterState().thirdPartyCount }}</span>
      </label>
    }

    @if (rows().length) {
      <ui-scroll-container>
        <table class="viewer-table">
          <thead>
            <tr>
              @for (heading of headings(); track $index) {
                <th [class]="columnClass(heading)">
                  {{ heading.label }}
                </th>
              }
            </tr>
          </thead>

          <tbody>
            @for (row of rows(); track row.key) {
              <tr
                class="viewer-table__row"
                [class.viewer-table__row--subitem]="row.isSubItem"
                [class.viewer-table__row--group]="row.isGroup"
                [class.viewer-table__row--entity-child]="row.indentLevel === 1 && !row.isSubItem"
                [class.viewer-table__row--entity-subitem]="row.indentLevel === 2"
                [class.viewer-table__row--even]="row.stripe === 'even'"
                [class.viewer-table__row--odd]="row.stripe === 'odd'"
              >
                @for (cell of row.cells; track $index) {
                  <td
                    [class]="columnClass(cell.heading)"
                    [class.viewer-table__cell--empty]="!cell.heading || cell.value === undefined || cell.value === null"
                  >
                    @if (cell.heading && cell.value !== undefined && cell.value !== null) {
                      <div
                        class="viewer-table__cell-content"
                        [class.viewer-table__cell-content--group]="$index === 0 && row.isGroup"
                      >
                        <ui-viewer-detail-value [value]="cell.value" [heading]="cell.heading" [context]="context()" />

                        @if ($index === 0 && row.isGroup && row.entityInfo; as entityInfo) {
                          @if (entityInfo.category) {
                            <span class="viewer-table__adorn">{{ entityInfo.category }}</span>
                          }
                          @if (entityInfo.isFirstParty) {
                            <span class="viewer-table__adorn viewer-table__adorn--first-party">1st party</span>
                          }
                          @if (entityInfo.homepage) {
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
                }
              </tr>
            }
          </tbody>
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
      gap: 8px;
      align-items: center;
      margin-bottom: 12px;
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.875rem;
    }

    .viewer-table__filter input {
      margin: 0;
    }

    .viewer-table__filter-count {
      color: var(--mat-sys-on-surface);
      font-weight: 600;
    }

    .viewer-table {
      width: 100%;
      min-width: 42rem;
      border-collapse: separate;
      border-spacing: 0;
      border: 1px solid color-mix(in srgb, var(--mat-sys-outline) 50%, white);
      border-radius: 12px;
      overflow: hidden;
      background: var(--mat-sys-surface);
    }

    .viewer-table th,
    .viewer-table td {
      padding: 12px;
      vertical-align: top;
      border-bottom: 1px solid color-mix(in srgb, var(--mat-sys-outline-variant) 60%, white);
    }

    .viewer-table thead th {
      position: sticky;
      top: 0;
      z-index: 1;
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface-variant);
      font-weight: 500;
      text-align: left;
    }

    .viewer-table tbody tr:last-child td {
      border-bottom: 0;
    }

    .viewer-table__row--group {
      background: color-mix(in srgb, var(--mat-sys-surface-variant) 44%, white);
    }

    .viewer-table__row--group td {
      color: var(--mat-sys-on-surface);
      font-size: 1.05em;
      font-weight: 700;
    }

    .viewer-table__row--group td:first-child {
      min-width: max-content;
      font-weight: 400;
    }

    .viewer-table__row--even {
      background: color-mix(in srgb, var(--mat-sys-surface-variant) 18%, white);
    }

    .viewer-table__row--subitem td {
      padding-top: 8px;
      padding-bottom: 8px;
      color: var(--mat-sys-on-surface-variant);
    }

    .viewer-table__row--subitem td:first-child,
    .viewer-table__row--entity-child td:first-child {
      padding-left: 24px;
    }

    .viewer-table__row--entity-subitem td:first-child {
      display: block;
      margin-left: 20px;
      padding-left: 10px;
      border-left: 1px solid color-mix(in srgb, var(--mat-sys-primary) 50%, white);
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
      color: var(--mat-sys-on-surface-variant);
    }

    .viewer-table__adorn--first-party {
      border-color: color-mix(in srgb, var(--mat-sys-primary) 60%, white);
      color: var(--mat-sys-primary);
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
  imports: [ScrollContainerComponent, ViewerDetailValueComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerTableComponent {
  tableDetails = input.required<Details.Table | Details.Opportunity>();
  auditId = input<string | null>(null);
  context = input<ViewerDiagnosticContext | null>(null);

  readonly showThirdParty = signal(true);

  readonly headings = computed(() => this.tableDetails().headings);
  readonly bundles = computed(() => this.buildBundles());
  readonly filterState = computed<FilterState>(() => {
    const bundles = this.bundles();
    const hasFilterableColumns = this.headings().some(
      (heading) => heading.valueType === 'url' || heading.valueType === 'source-location',
    );
    const isExcludedAudit = FILTER_EXCLUDED_AUDITS.has(this.auditId() ?? '');
    const thirdPartyBundleCount = bundles.filter((bundle) => bundle.thirdParty).length;
    const mixed = thirdPartyBundleCount > 0 && thirdPartyBundleCount < bundles.length;

    return {
      enabled: hasFilterableColumns && !isExcludedAudit && mixed,
      mixed,
      thirdPartyCount: bundles.filter((bundle) => bundle.thirdParty && bundle.countable).length,
    };
  });

  readonly rows = computed<
    Array<
      RenderRow & {
        stripe: 'even' | 'odd' | null;
      }
    >
  >(() => {
    const bundles = this.visibleBundles();
    const usesZebraStripes = !this.usesEntityGrouping();
    let stripe: 'even' | 'odd' = 'even';

    return bundles.flatMap((bundle) => {
      const rowStripe = usesZebraStripes ? stripe : null;
      if (usesZebraStripes) {
        stripe = stripe === 'even' ? 'odd' : 'even';
      }

      return bundle.rows.map((row) => ({
        ...row,
        stripe: rowStripe,
      }));
    });
  });

  constructor() {
    effect(() => {
      const filterState = this.filterState();
      const auditId = this.auditId();
      const showByDefault =
        !FILTER_HIDE_BY_DEFAULT_AUDITS.has(auditId ?? '') || !filterState.mixed;

      untracked(() => this.showThirdParty.set(showByDefault));
    });
  }

  columnClass(heading: Heading): string {
    return heading ? `viewer-table__cell viewer-table__cell--${heading.valueType}` : 'viewer-table__cell';
  }

  onShowThirdPartyChange(checked: boolean): void {
    this.showThirdParty.set(checked);
  }

  private visibleBundles(): RowBundle[] {
    if (!this.filterState().enabled || this.showThirdParty()) {
      return this.bundles();
    }

    return this.bundles().filter((bundle) => !bundle.thirdParty);
  }

  private buildBundles(): RowBundle[] {
    const details = this.tableDetails();
    const headings = details.headings;
    const groupItems = this.getEntityGroupItems(details);

    if (groupItems.length) {
      const bundles: RowBundle[] = [];
      for (const groupItem of groupItems) {
        const entityName = typeof groupItem.entity === 'string' ? groupItem.entity : undefined;
        const entityInfo = this.entityInfo(entityName);
        const thirdParty = this.isThirdPartyEntity(entityName, groupItem, headings);
        const groupHeadings = this.groupedHeadings(headings);

        bundles.push({
          key: `group-${entityName ?? 'unattributable'}`,
          thirdParty,
          countable: false,
          rows: [
            this.buildRow(`group-${entityName ?? 'unattributable'}`, groupItem, groupHeadings, {
              isGroup: true,
              indentLevel: 0,
              entityName,
              entityInfo,
            }),
          ],
        });

        details.items
          .filter((item) => this.entityNameForItem(item, headings) === entityName)
          .forEach((item, index) => {
            bundles.push(
              this.bundleFromItem(
                `group-${entityName ?? 'unattributable'}-item-${index}`,
                item,
                headings,
                {
                  isGroup: false,
                  indentLevel: 1,
                  entityName,
                  entityInfo,
                  thirdParty,
                },
              ),
            );
          });
      }

      return bundles;
    }

    return details.items.map((item, index) => {
      const entityName = this.entityNameForItem(item, headings);
      const entityInfo = this.entityInfo(entityName);
      const thirdParty = this.isThirdPartyEntity(entityName, item, headings);
      const isGroupedHeader = !!(details.isEntityGrouped && entityName);

      return this.bundleFromItem(`item-${index}`, item, headings, {
        isGroup: isGroupedHeader,
        indentLevel: 0,
        entityName,
        entityInfo,
        thirdParty,
      });
    });
  }

  private bundleFromItem(
    key: string,
    item: Details.TableItem,
    headings: Details.TableColumnHeading[],
    options: {
      isGroup: boolean;
      indentLevel: 0 | 1 | 2;
      entityName?: string;
      entityInfo?: EntityInfo;
      thirdParty: boolean;
    },
  ): RowBundle {
    const rows: RenderRow[] = [
      this.buildRow(key, item, options.isGroup ? this.groupedHeadings(headings) : headings, {
        isGroup: options.isGroup,
        indentLevel: options.indentLevel,
        entityName: options.entityName,
        entityInfo: options.entityInfo,
      }),
    ];

    const subHeadings = headings.map((heading) => this.deriveSubItemsHeading(heading));
    if (item.subItems && subHeadings.some(Boolean)) {
      item.subItems.items.forEach((subItem, subItemIndex) => {
        rows.push(
          this.buildRow(`${key}-sub-${subItemIndex}`, subItem, subHeadings, {
            isGroup: false,
            indentLevel: options.isGroup ? 1 : options.indentLevel === 1 ? 2 : 1,
            entityName: options.entityName,
            entityInfo: options.entityInfo,
            isSubItem: true,
          }),
        );
      });
    }

    return {
      key,
      thirdParty: options.thirdParty,
      countable: !options.isGroup,
      rows,
    };
  }

  private buildRow(
    key: string,
    item: Details.TableItem,
    headings: Heading[],
    options: {
      isGroup: boolean;
      indentLevel: 0 | 1 | 2;
      entityName?: string;
      entityInfo?: EntityInfo;
      isSubItem?: boolean;
    },
  ): RenderRow {
    return {
      key,
      isSubItem: !!options.isSubItem,
      isGroup: options.isGroup,
      indentLevel: options.indentLevel,
      entityName: options.entityName,
      entityInfo: options.entityInfo,
      cells: headings.map((heading) => ({
        heading,
        value: heading?.key ? item[heading.key] : undefined,
      })),
    };
  }

  private groupedHeadings(headings: Details.TableColumnHeading[]): Details.TableColumnHeading[] {
    if (!headings.length) {
      return headings;
    }

    return [{ ...headings[0], valueType: 'text' }, ...headings.slice(1)];
  }

  private deriveSubItemsHeading(heading: Details.TableColumnHeading): Heading {
    if (!heading.subItemsHeading) {
      return null;
    }

    return {
      key: heading.subItemsHeading.key || '',
      valueType: heading.subItemsHeading.valueType || heading.valueType,
      granularity: heading.subItemsHeading.granularity || heading.granularity,
      displayUnit: heading.subItemsHeading.displayUnit || heading.displayUnit,
      label: '',
    };
  }

  private usesEntityGrouping(): boolean {
    return !!(this.tableDetails().isEntityGrouped || this.getEntityGroupItems(this.tableDetails()).length);
  }

  private getEntityGroupItems(details: Details.Table | Details.Opportunity): TableItemWithEntity[] {
    const headings = details.headings;
    const firstHeadingKey = headings[0]?.key;
    if (!firstHeadingKey) {
      return [];
    }

    const itemsWithEntity = details.items.map((item) => ({
      ...item,
      entity: this.entityNameForItem(item, headings),
    }));
    if (!itemsWithEntity.length || details.isEntityGrouped || !itemsWithEntity.some((item) => item.entity)) {
      return [];
    }

    const skippedColumns = new Set(details.skipSumming ?? []);
    const summableColumns = headings
      .filter((heading) => heading.key && !skippedColumns.has(heading.key) && SUMMABLE_VALUE_TYPES.has(heading.valueType))
      .map((heading) => heading.key as string);

    const groupedByEntity = new Map<string | undefined, TableItemWithEntity>();
    for (const item of itemsWithEntity) {
      const entityName = typeof item.entity === 'string' ? item.entity : undefined;
      const groupedItem =
        groupedByEntity.get(entityName) ??
        ({
          [firstHeadingKey]: entityName || 'Unattributable',
          entity: entityName,
        } as TableItemWithEntity);
      const groupedRecord = groupedItem as Record<string, Details.ItemValue | undefined>;
      const itemRecord = item as Record<string, Details.ItemValue | undefined>;

      for (const key of summableColumns) {
        groupedRecord[key] = Number(groupedRecord[key] || 0) + Number(itemRecord[key] || 0);
      }

      groupedByEntity.set(entityName, groupedItem);
    }

    const result = [...groupedByEntity.values()];
    if (details.sortedBy?.length) {
      result.sort((a, b) => this.compareTableItems(a, b, details.sortedBy!));
    }

    return result;
  }

  private compareTableItems(a: Details.TableItem, b: Details.TableItem, sortedBy: string[]): number {
    for (const key of sortedBy) {
      const aValue = a[key];
      const bValue = b[key];

      if (typeof aValue === 'number' && typeof bValue === 'number' && aValue !== bValue) {
        return bValue - aValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string' && aValue !== bValue) {
        return aValue.localeCompare(bValue);
      }
    }

    return 0;
  }

  private entityNameForItem(item: Details.TableItem, headings: Details.TableColumnHeading[]): string | undefined {
    if (typeof item['entity'] === 'string') {
      return item['entity'];
    }

    const url = this.locateUrl(item, headings);
    if (!url) {
      return undefined;
    }

    const origin = this.safeOrigin(url);
    if (!origin) {
      return undefined;
    }

    return this.context()?.entities?.find((entity) => entity.origins.includes(origin))?.name;
  }

  private locateUrl(item: Details.TableItem, headings: Details.TableColumnHeading[]): string | undefined {
    const urlKey = headings.find((heading) => heading.valueType === 'url')?.key;
    if (urlKey && typeof urlKey === 'string') {
      const value = item[urlKey];
      if (typeof value === 'string') {
        return value;
      }

      if (typeof value === 'object' && value !== null && 'type' in value && value.type === 'url') {
        return value.value;
      }
    }

    const sourceLocationKey = headings.find((heading) => heading.valueType === 'source-location')?.key;
    if (sourceLocationKey) {
      const value = item[sourceLocationKey];
      if (typeof value === 'object' && value !== null && 'type' in value && value.type === 'source-location') {
        return value.url;
      }
    }

    return undefined;
  }

  private entityInfo(entityName?: string): EntityInfo | undefined {
    return this.context()?.entities?.find((entity) => entity.name === entityName);
  }

  private isThirdPartyEntity(
    entityName: string | undefined,
    item: Details.TableItem,
    headings: Details.TableColumnHeading[],
  ): boolean {
    const context = this.context();
    const firstPartyEntityName = context?.entities?.find((entity) => entity.isFirstParty)?.name;
    if (firstPartyEntityName && entityName) {
      return entityName !== firstPartyEntityName;
    }

    const url = this.locateUrl(item, headings);
    const finalDisplayedUrl = context?.finalDisplayedUrl;
    if (!url || !finalDisplayedUrl) {
      return false;
    }

    const itemDomain = this.rootDomain(url);
    const finalDomain = this.rootDomain(finalDisplayedUrl);
    return !!itemDomain && !!finalDomain && itemDomain !== finalDomain;
  }

  private safeOrigin(url: string): string | null {
    try {
      return new URL(url).origin;
    } catch {
      return null;
    }
  }

  private rootDomain(url: string): string | null {
    try {
      const hostname = new URL(url).hostname;
      const parts = hostname.split('.').filter(Boolean);
      if (parts.length <= 2) {
        return hostname;
      }

      return parts.slice(-2).join('.');
    } catch {
      return null;
    }
  }
}
