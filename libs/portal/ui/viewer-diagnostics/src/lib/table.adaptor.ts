import type Details from 'lighthouse/types/lhr/audit-details';
import type Result from 'lighthouse/types/lhr/lhr';
import type { ViewerDiagnosticContext } from './viewer-diagnostic.models';

type Heading = Details.TableColumnHeading | null;
type EntityInfo = Result.Entities[number];
type TableItemWithEntity = Details.TableItem & { entity?: string };
type TableRowBundle = {
  key: string;
  thirdParty: boolean;
  countable: boolean;
  rows: TableRow[];
};

export type TableFilterState = {
  enabled: boolean;
  mixed: boolean;
  thirdPartyCount: number;
};

export type TableRenderColumn = {
  id: string;
  index: number;
  heading: Details.TableColumnHeading;
  headerClassName: string;
  sharedClassName: string;
};

export type TableRenderCell = {
  heading: Heading;
  value: Details.ItemValue | undefined;
  className: string;
  empty: boolean;
};

export type TableRenderRow = TableRow & {
  stripe: 'even' | 'odd' | null;
};

export type TableBaseModel = {
  columns: TableRenderColumn[];
  bundles: TableRowBundle[];
  filterState: TableFilterState;
  usesEntityGrouping: boolean;
};

type TableRow = {
  key: string;
  isSubItem: boolean;
  isGroup: boolean;
  indentLevel: 0 | 1 | 2;
  entityName?: string;
  entityInfo?: EntityInfo;
  cells: TableRenderCell[];
};

type BuildTableBaseModelParams = {
  details: Details.Table | Details.Opportunity;
  auditId: string | null;
  context: ViewerDiagnosticContext | null;
};

type BuildVisibleRowsParams = {
  bundles: TableRowBundle[];
  filterState: TableFilterState;
  showThirdParty: boolean;
  usesEntityGrouping: boolean;
};

const FILTER_EXCLUDED_AUDITS = new Set([
  'uses-rel-preconnect',
  'third-party-facades',
  'network-dependency-tree-insight',
]);

const FILTER_HIDE_BY_DEFAULT_AUDITS = new Set(['legacy-javascript', 'legacy-javascript-insight']);
const METRIC_VALUE_TYPES = new Set<Details.TableColumnHeading['valueType']>(['bytes', 'numeric', 'ms', 'timespanMs']);

export function buildTableBaseModel({ details, auditId, context }: BuildTableBaseModelParams): TableBaseModel {
  const columns = buildColumns(details.headings);
  const { bundles, usesEntityGrouping } = buildBundles(details, context, columns);
  return {
    columns,
    bundles,
    usesEntityGrouping,
    filterState: buildFilterState(details.headings, auditId, bundles),
  };
}

export function buildVisibleRows({
  bundles,
  filterState,
  showThirdParty,
  usesEntityGrouping,
}: BuildVisibleRowsParams): TableRenderRow[] {
  const visibleBundles =
    !filterState.enabled || showThirdParty ? bundles : bundles.filter((bundle) => !bundle.thirdParty);
  let stripe: 'even' | 'odd' = 'even';

  return visibleBundles.flatMap((bundle) => {
    const rowStripe = usesEntityGrouping ? null : stripe;
    if (!usesEntityGrouping) {
      stripe = stripe === 'even' ? 'odd' : 'even';
    }

    return bundle.rows.map((row) => ({
      ...row,
      stripe: rowStripe,
    }));
  });
}

export function getDefaultShowThirdParty(auditId: string | null, filterState: TableFilterState): boolean {
  return !FILTER_HIDE_BY_DEFAULT_AUDITS.has(auditId ?? '') || !filterState.mixed;
}

function buildColumns(headings: Details.TableColumnHeading[]): TableRenderColumn[] {
  return headings.map((heading, index) => {
    const sharedClassName = isNarrowMetricColumn(headings, index) ? 'viewer-table__column--narrow' : '';
    const headerClassName = classNames(
      cellClassName(heading),
      'viewer-table__header-cell',
      sharedClassName,
      METRIC_VALUE_TYPES.has(heading.valueType) && 'viewer-table__header-cell--metric',
    );

    return {
      id: `column-${index}`,
      index,
      heading,
      headerClassName,
      sharedClassName,
    };
  });
}

function buildFilterState(
  headings: Details.TableColumnHeading[],
  auditId: string | null,
  bundles: TableRowBundle[],
): TableFilterState {
  const hasFilterableColumns = headings.some(
    (heading) => heading.valueType === 'url' || heading.valueType === 'source-location',
  );
  const isExcludedAudit = FILTER_EXCLUDED_AUDITS.has(auditId ?? '');
  const thirdPartyBundleCount = bundles.filter((bundle) => bundle.thirdParty).length;
  const mixed = thirdPartyBundleCount > 0 && thirdPartyBundleCount < bundles.length;

  return {
    enabled: hasFilterableColumns && !isExcludedAudit && mixed,
    mixed,
    thirdPartyCount: bundles.filter((bundle) => bundle.thirdParty && bundle.countable).length,
  };
}

function buildBundles(
  details: Details.Table | Details.Opportunity,
  context: ViewerDiagnosticContext | null,
  columns: TableRenderColumn[],
): Pick<TableBaseModel, 'bundles' | 'usesEntityGrouping'> {
  const headings = details.headings;
  const groupItems = getEntityGroupItems(details, context);
  const usesEntityGrouping = !!details.isEntityGrouped || groupItems.length > 0;

  if (groupItems.length) {
    const bundles: TableRowBundle[] = [];
    for (const groupItem of groupItems) {
      const entityName = typeof groupItem.entity === 'string' ? groupItem.entity : undefined;
      const entityInfo = findEntityInfo(context, entityName);
      const thirdParty = isThirdPartyEntity(context, entityName, groupItem, headings);
      const groupHeadings = groupedHeadings(headings);

      bundles.push({
        key: `group-${entityName ?? 'unattributable'}`,
        thirdParty,
        countable: false,
        rows: [
          buildRow(`group-${entityName ?? 'unattributable'}`, groupItem, groupHeadings, columns, {
            isGroup: true,
            indentLevel: 0,
            entityName,
            entityInfo,
          }),
        ],
      });

      details.items
        .filter((item) => entityNameForItem(context, item, headings) === entityName)
        .forEach((item, index) => {
          bundles.push(
            bundleFromItem(`group-${entityName ?? 'unattributable'}-item-${index}`, item, headings, columns, {
              isGroup: false,
              indentLevel: 1,
              entityName,
              entityInfo,
              thirdParty,
            }),
          );
        });
    }

    return { bundles, usesEntityGrouping };
  }

  return {
    usesEntityGrouping,
    bundles: details.items.map((item, index) => {
      const entityName = entityNameForItem(context, item, headings);
      const entityInfo = findEntityInfo(context, entityName);
      const thirdParty = isThirdPartyEntity(context, entityName, item, headings);
      const isGroupedHeader = !!(details.isEntityGrouped && entityName);

      return bundleFromItem(`item-${index}`, item, headings, columns, {
        isGroup: isGroupedHeader,
        indentLevel: 0,
        entityName,
        entityInfo,
        thirdParty,
      });
    }),
  };
}

function bundleFromItem(
  key: string,
  item: Details.TableItem,
  headings: Details.TableColumnHeading[],
  columns: TableRenderColumn[],
  options: {
    isGroup: boolean;
    indentLevel: 0 | 1 | 2;
    entityName?: string;
    entityInfo?: EntityInfo;
    thirdParty: boolean;
  },
): TableRowBundle {
  const rows: TableRow[] = [
    buildRow(key, item, options.isGroup ? groupedHeadings(headings) : headings, columns, {
      isGroup: options.isGroup,
      indentLevel: options.indentLevel,
      entityName: options.entityName,
      entityInfo: options.entityInfo,
    }),
  ];

  const subHeadings = headings.map((heading) => deriveSubItemsHeading(heading));
  if (item.subItems && subHeadings.some(Boolean)) {
    item.subItems.items.forEach((subItem, subItemIndex) => {
      rows.push(
        buildRow(`${key}-sub-${subItemIndex}`, subItem, subHeadings, columns, {
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

function buildRow(
  key: string,
  item: Details.TableItem,
  headings: Heading[],
  columns: TableRenderColumn[],
  options: {
    isGroup: boolean;
    indentLevel: 0 | 1 | 2;
    entityName?: string;
    entityInfo?: EntityInfo;
    isSubItem?: boolean;
  },
): TableRow {
  return {
    key,
    isSubItem: !!options.isSubItem,
    isGroup: options.isGroup,
    indentLevel: options.indentLevel,
    entityName: options.entityName,
    entityInfo: options.entityInfo,
    cells: headings.map((heading, index) => buildCell(heading, item, columns[index])),
  };
}

function buildCell(heading: Heading, item: Details.TableItem, column: TableRenderColumn): TableRenderCell {
  const value = heading?.key ? item[heading.key] : undefined;

  return {
    heading,
    value,
    className: classNames(cellClassName(heading), column.sharedClassName),
    empty: !heading || value === undefined || value === null,
  };
}

function groupedHeadings(headings: Details.TableColumnHeading[]): Details.TableColumnHeading[] {
  return headings.length ? [{ ...headings[0], valueType: 'text' }, ...headings.slice(1)] : headings;
}

function deriveSubItemsHeading(heading: Details.TableColumnHeading): Heading {
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

function getEntityGroupItems(
  details: Details.Table | Details.Opportunity,
  context: ViewerDiagnosticContext | null,
): TableItemWithEntity[] {
  const headings = details.headings;
  const firstHeadingKey = headings[0]?.key;
  if (!firstHeadingKey) {
    return [];
  }

  const itemsWithEntity = details.items.map((item) => ({
    ...item,
    entity: entityNameForItem(context, item, headings),
  }));

  if (!itemsWithEntity.length || details.isEntityGrouped || !itemsWithEntity.some((item) => item.entity)) {
    return [];
  }

  const skippedColumns = new Set(details.skipSumming ?? []);
  const summableColumns = headings
    .filter((heading) => heading.key && !skippedColumns.has(heading.key) && METRIC_VALUE_TYPES.has(heading.valueType))
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
    result.sort((a, b) => compareTableItems(a, b, details.sortedBy!));
  }

  return result;
}

function compareTableItems(a: Details.TableItem, b: Details.TableItem, sortedBy: string[]): number {
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

function entityNameForItem(
  context: ViewerDiagnosticContext | null,
  item: Details.TableItem,
  headings: Details.TableColumnHeading[],
): string | undefined {
  if (typeof item['entity'] === 'string') {
    return item['entity'];
  }

  const url = locateUrl(item, headings);
  if (!url) {
    return undefined;
  }

  const origin = safeOrigin(url);
  if (!origin) {
    return undefined;
  }

  return context?.entities?.find((entity) => entity.origins.includes(origin))?.name;
}

function locateUrl(item: Details.TableItem, headings: Details.TableColumnHeading[]): string | undefined {
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

function findEntityInfo(context: ViewerDiagnosticContext | null, entityName?: string): EntityInfo | undefined {
  return context?.entities?.find((entity) => entity.name === entityName);
}

function isThirdPartyEntity(
  context: ViewerDiagnosticContext | null,
  entityName: string | undefined,
  item: Details.TableItem,
  headings: Details.TableColumnHeading[],
): boolean {
  const firstPartyEntityName = context?.entities?.find((entity) => entity.isFirstParty)?.name;
  if (firstPartyEntityName && entityName) {
    return entityName !== firstPartyEntityName;
  }

  const url = locateUrl(item, headings);
  const finalDisplayedUrl = context?.finalDisplayedUrl;
  if (!url || !finalDisplayedUrl) {
    return false;
  }

  const itemDomain = rootDomain(url);
  const finalDomain = rootDomain(finalDisplayedUrl);
  return !!itemDomain && !!finalDomain && itemDomain !== finalDomain;
}

function safeOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function rootDomain(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split('.').filter(Boolean);
    return parts.length <= 2 ? hostname : parts.slice(-2).join('.');
  } catch {
    return null;
  }
}

function cellClassName(heading: Heading): string {
  return heading ? `viewer-table__cell viewer-table__cell--${heading.valueType}` : 'viewer-table__cell';
}

function isNarrowMetricColumn(headings: Details.TableColumnHeading[], index: number): boolean {
  const current = headings[index];
  if (!current || !METRIC_VALUE_TYPES.has(current.valueType)) {
    return false;
  }

  const previous = headings[index - 1];
  const previousIsUrl = previous?.valueType === 'url';
  const previousIsMetric = !!previous && METRIC_VALUE_TYPES.has(previous.valueType);

  return previousIsUrl || (previousIsMetric && headings[index - 2]?.valueType === 'url');
}

function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
