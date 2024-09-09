import { DOCUMENT, ɵDomAdapter as DomAdapter, ɵgetDOM as getDOM } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import Details from 'lighthouse/types/lhr/audit-details';

const SUMMABLE_VALUETYPES = ['bytes', 'numeric', 'ms', 'timespanMs'];

@Injectable({ providedIn: 'root' })
export class DetailsRenderer {
  readonly #dom: DomAdapter;

  constructor(@Inject(DOCUMENT) private _doc: any) {
    this.#dom = getDOM();
  }

  #createElement<T = HTMLElement>(tagName: string, className?: string): T {
    const element = this.#dom.createElement(tagName);
    if (className) {
      for (const token of className.split(/\s+/)) {
        if (token) element.classList.add(token);
      }
    }
    return element as T;
  }

  #createChildOf<T = HTMLElement>(parentElement: HTMLElement, tagName: string, className?: string): T {
    const element = this.#createElement(tagName, className);
    parentElement.append(element);
    return element as T;
  }

  // #renderer = inject(Renderer2);

  render(details: Details) {
    switch (details.type) {
      case 'filmstrip':
      // return this._renderFilmstrip(details);
      case 'list':
        return this.#renderList(details as Details.List);
      case 'table':
      case 'opportunity':
        return this.#renderTable(details);
      case 'criticalrequestchain':
      // return CriticalRequestChainRenderer.render(this._dom, details, this);

      // Internal-only details, not for rendering.
      case 'screenshot':
      case 'debugdata':
      case 'treemap-data':
        return null;

      default: {
        // @ts-expect-error - all detail types need to be handled above so tsc thinks this is unreachable.
        // Call _renderUnknown() to be forward compatible with new, unexpected detail types.
        return this._renderUnknown(details.type, details);
      }
    }
  }

  #renderList(details: Details.List) {
    const listContainer = this.#createElement<HTMLDivElement>('div', 'lh-list');
    details.items.forEach((item) => {
      const listItem = this.render(item);
      if (!listItem) return;
      listContainer.append(listItem);
    });

    return listContainer;
  }

  #renderTableValue(value: Details.ItemValue, heading: Details.TableColumnHeading) {
    if (value === undefined || value === null) {
      return null;
    }

    // First deal with the possible object forms of value.
    if (typeof value === 'object' && 'type' in value) {
      // The value's type overrides the heading's for this column.
      switch (value.type) {
        case 'code': {
          return this.#renderCode(value.value as string);
        }
        case 'link': {
          return this._renderLink(value);
        }
        case 'node': {
          return this.renderNode(value);
        }
        case 'numeric': {
          return this._renderNumeric(value);
        }
        case 'source-location': {
          return this.renderSourceLocation(value);
        }
        case 'url': {
          return this.renderTextURL(value.value);
        }
        default: {
          return this._renderUnknown(value.type, value);
        }
      }
    }

    // Next, deal with primitives.
    switch (heading.valueType) {
      case 'bytes': {
        const numValue = Number(value);
        return this._renderBytes({ value: numValue, granularity: heading.granularity });
      }
      case 'code': {
        const strValue = String(value);
        return this.#renderCode(strValue);
      }
      case 'ms': {
        const msValue = {
          value: Number(value),
          granularity: heading.granularity,
          displayUnit: heading.displayUnit,
        };
        return this._renderMilliseconds(msValue);
      }
      case 'numeric': {
        const numValue = Number(value);
        return this._renderNumeric({ value: numValue, granularity: heading.granularity });
      }
      case 'text': {
        const strValue = String(value);
        return this._renderText(strValue);
      }
      case 'thumbnail': {
        const strValue = String(value);
        return this._renderThumbnail(strValue);
      }
      case 'timespanMs': {
        const numValue = Number(value);
        return this._renderMilliseconds({ value: numValue });
      }
      case 'url': {
        const strValue = String(value);
        if (URL_PREFIXES.some((prefix) => strValue.startsWith(prefix))) {
          return this.renderTextURL(strValue);
        } else {
          // Fall back to <pre> rendering if not actually a URL.
          return this._renderCode(strValue);
        }
      }
      default: {
        return this._renderUnknown(heading.valueType, value);
      }
    }
  }

  #renderTableRow(item: Details.TableItem, headings: Details.TableColumnHeading[]): HTMLElement {
    const rowElem = this.#createElement('tr');

    for (const heading of headings) {
      if (!heading || !heading.key) {
        this.#createChildOf(rowElem, 'td', 'lh-table-column--empty');
        continue;
      }

      const value = item[heading.key];
      let valueElement: HTMLElement | undefined;
      if (value !== undefined && value !== null) {
        valueElement = this.#renderTableValue(value, heading);
      }

      if (valueElement) {
        const classes = `lh-table-column--${heading.valueType}`;
        this.#createChildOf(rowElem, 'td', classes).append(valueElement);
      } else {
        // Empty cell is rendered for a column if:
        // - the pair is null
        // - the heading key is null
        // - the value is undefined/null
        this.#createChildOf(rowElem, 'td', 'lh-table-column--empty');
      }
    }
    return rowElem;
  }

  #renderEntityGroupRow(item: Details.TableItem, headings: Details.TableColumnHeading[]) {
    const entityColumnHeading = { ...headings[0] };
    // In subitem-situations (unused-javascript), ensure Entity name is not rendered as code, etc.
    entityColumnHeading.valueType = 'text';
    const groupedRowHeadings = [entityColumnHeading, ...headings.slice(1)];
    const fragment = document.createDocumentFragment();
    fragment.append(this.#renderTableRow(item, groupedRowHeadings));
    this._dom.find('tr', fragment).classList.add('lh-row--group');
    return fragment;

    // Esss
  }

  #renderTable(details: Details.Table | Details.Opportunity) {
    if (!details.items.length) return this.#createElement<HTMLSpanElement>('span');

    const tableElem = this.#createElement<HTMLTableElement>('table', 'lh-table');
    const theadElem = this.#createChildOf(tableElem, 'thead');
    const theadTrElem = this.#createChildOf(theadElem, 'tr');

    for (const heading of details.headings) {
      const valueType = heading.valueType || 'text';
      const classes = `lh-table-column--${valueType}`;
      const labelEl = this.#createElement<HTMLDivElement>('div', 'lh-text');
      if (typeof heading.label === 'string' || heading.label === null) {
        labelEl.textContent = heading.label;
      }
      this.#createChildOf(theadTrElem, 'th', classes).append(labelEl);
    }

    const entityItems = this.#getEntityGroupItems(details);
    const tbodyElem = this.#createChildOf(tableElem, 'tbody');

    if (entityItems.length) {
      for (const entityItem of entityItems) {
        // TODO Review why this requires using [] and not dot notation! Seems like a bug
        const entityName = typeof entityItem['entity'] === 'string' ? entityItem['entity'] : undefined;
        const headings = details.headings;
        const entityGroupFragment = this.#renderEntityGroupRow(entityItem, details.headings);
      }
    }
  }

  #renderText(text: string) {
    const element = this.#createElement('div', 'lh-text');
    element.textContent = text;
    return element;
  }

  #renderLink(details) {
    const a = this.#createElement<HTMLAnchorElement>('a');
    this._dom.safelySetHref(a, details.url);

    if (!a.href) {
      // Fall back to just the link text if invalid or protocol not allowed.
      const element = this.#renderText(details.text);
      element.classList.add('lh-link');
      return element;
    }

    a.rel = 'noopener';
    a.target = '_blank';
    a.textContent = details.text;
    a.classList.add('lh-link');
    return a;
  }

  _renderFilmstrip(details: Details.Filmstrip) {
    const filmstripEl = this.#createElement('div', 'lh-filmstrip');

    for (const thumbnail of details.items) {
      const frameEl = this.#createChildOf(filmstripEl, 'div', 'lh-filmstrip__frame');
      const imgEl = this.#createChildOf<HTMLImageElement>(frameEl, 'img', 'lh-filmstrip__thumbnail');
      imgEl.src = thumbnail.data;
      imgEl.alt = `Screenshot`;
    }
    return filmstripEl;
  }

  #renderCode(text: string) {
    const pre = this.#createElement('pre', 'lh-code');
    pre.textContent = text;
    return pre;
  }

  #getEntityGroupItems(details: Details.Table | Details.Opportunity) {
    const { items, headings, sortedBy } = details;
    // Exclude entity-grouped audits and results without entity classification.
    // Eg. Third-party Summary comes entity-grouped.
    if (!items.length || details.isEntityGrouped || !items.some((item) => item.entity)) {
      return [];
    }

    const skippedColumns = new Set(details.skipSumming || []);
    const summableColumns: string[] = [];
    for (const heading of headings) {
      if (!heading.key || skippedColumns.has(heading.key)) continue;
      if (SUMMABLE_VALUETYPES.includes(heading.valueType)) {
        summableColumns.push(heading.key);
      }
    }

    // Grab the first column's key to group by entity
    const firstColumnKey = headings[0].key;
    if (!firstColumnKey) return [];

    const byEntity = new Map<string | undefined, Details.TableItem>();
    for (const item of items) {
      // TODO Review why this requires using [] and not dot notation! Seems like a bug
      const entityName = typeof item['entity'] === 'string' ? item['entity'] : undefined;
      const groupedItem = byEntity.get(entityName) || {
        [firstColumnKey]: entityName || 'unattributable',
        entity: entityName,
      };
      for (const key of summableColumns) {
        groupedItem[key] = Number(groupedItem[key] || 0) + Number(item[key] || 0);
      }
      byEntity.set(entityName, groupedItem);
    }

    const result = [...byEntity.values()];
    if (sortedBy) {
      result.sort(this.#getTableItemSortComparator(sortedBy));
    }
    return result;
  }

  #getTableItemSortComparator(sortedBy: string[]) {
    return (a: Details.TableItem, b: Details.TableItem) => {
      for (const key of sortedBy) {
        const aVal = a[key];
        const bVal = b[key];
        if (typeof aVal !== typeof bVal || !['number', 'string'].includes(typeof aVal)) {
          console.warn(`Warning: Attempting to sort unsupported value type: ${key}.`);
        }
        if (typeof aVal === 'number' && typeof bVal === 'number' && aVal !== bVal) {
          return bVal - aVal;
        }
        if (typeof aVal === 'string' && typeof bVal === 'string' && aVal !== bVal) {
          return aVal.localeCompare(bVal);
        }
      }
      return 0;
    };
  }
}
