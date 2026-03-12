import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type Details from 'lighthouse/types/lhr/audit-details';
import type { IcuMessage } from 'lighthouse/types/lhr/i18n';
import { ViewerDetailNodeComponent } from './detail-node.component';
import { ViewerDiagnosticContext } from './viewer-diagnostic.models';

const URL_PREFIXES = ['http://', 'https://', 'data:'];
type TypedValue = Extract<Details.ItemValue, { type: string }>;
type TypedValueType = TypedValue['type'];

@Component({
  selector: 'ui-viewer-detail-value',
  template: `
    @switch (resolvedType()) {
      @case ('bytes') {
        <span class="numeric" [attr.title]="bytesTitle()">{{ formatBytes(primitiveNumber() ?? 0, heading()?.granularity) }}</span>
      }
      @case ('code') {
        <pre class="code">{{ codeText() }}</pre>
      }
      @case ('link') {
        @if (linkUrl(); as url) {
          <a class="link" [href]="url" target="_blank" rel="noopener">{{ linkText() }}</a>
        } @else {
          <span>{{ linkText() }}</span>
        }
      }
      @case ('ms') {
        <span class="numeric">{{ formatMilliseconds(primitiveNumber() ?? 0, heading()?.granularity, heading()?.displayUnit) }}</span>
      }
      @case ('timespanMs') {
        <span class="numeric">{{ formatMilliseconds(primitiveNumber() ?? 0, heading()?.granularity) }}</span>
      }
      @case ('node') {
        @if (nodeValue(); as node) {
          <ui-viewer-detail-node [node]="node" [context]="context()" [previewUrl]="previewUrl()" />
        }
      }
      @case ('numeric') {
        <span class="numeric">{{ numericText() }}</span>
      }
      @case ('source-location') {
        @if (sourceLocationHref(); as href) {
          <a
            class="link source-location"
            [href]="href"
            target="_blank"
            rel="noopener"
            [attr.title]="sourceLocationTitle()"
            [attr.data-source-url]="sourceLocationDataUrl()"
            [attr.data-source-line]="sourceLocationDataLine()"
            [attr.data-source-column]="sourceLocationDataColumn()"
          >
            {{ sourceLocationText() }}
          </a>
        } @else {
          <span
            class="source-location"
            [attr.title]="sourceLocationTitle()"
            [attr.data-source-url]="sourceLocationDataUrl()"
            [attr.data-source-line]="sourceLocationDataLine()"
            [attr.data-source-column]="sourceLocationDataColumn()"
          >
            {{ sourceLocationText() }}
          </span>
        }
      }
      @case ('text') {
        <span>{{ textValue() }}</span>
      }
      @case ('thumbnail') {
        <img class="thumbnail" [src]="thumbnailSrc()" alt="" />
      }
      @case ('url') {
        @if (urlHref(); as href) {
          <a class="link url" [href]="href" target="_blank" rel="noopener">
            {{ urlDisplayText() }}
            @if (urlHostText(); as host) {
              <span class="url__host">{{ host }}</span>
            }
          </a>
        } @else {
          <pre class="code">{{ stringValue() }}</pre>
        }
      }
      @default {
        <span>{{ stringValue() }}</span>
      }
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .numeric {
      display: inline-block;
      min-width: max-content;
      text-align: end;
      white-space: nowrap;
    }

    .code {
      margin: 0;
      overflow-wrap: anywhere;
      white-space: pre-wrap;
      font-family: var(--mat-sys-body-medium-font, monospace);
      font-size: 0.8125rem;
      line-height: 1.45;
    }

    .link {
      color: var(--mat-sys-primary);
      text-decoration: none;
    }

    .link:hover {
      text-decoration: underline;
    }

    .thumbnail {
      display: block;
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid color-mix(in srgb, var(--mat-sys-outline) 60%, white);
    }

    .url {
      display: inline-flex;
      gap: 6px;
      align-items: baseline;
      flex-wrap: wrap;
      overflow-wrap: anywhere;
    }

    .url__host {
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.875rem;
    }

    .source-location {
      overflow-wrap: anywhere;
    }
  `,
  imports: [ViewerDetailNodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerDetailValueComponent {
  value = input<Details.ItemValue | undefined>();
  heading = input<Details.TableColumnHeading | null>(null);
  context = input<ViewerDiagnosticContext | null>(null);
  previewUrl = input<string | undefined>(undefined);

  readonly resolvedType = computed(() => {
    const value = this.value();
    const typedValueType = this.typedValueType(value);
    if (typedValueType) {
      return typedValueType;
    }

    return this.heading()?.valueType ?? 'text';
  });

  primitiveNumber(): number | null {
    const value = this.value();

    if (typeof value === 'number') {
      return value;
    }

    if (this.hasType(value, 'numeric')) {
      return value.value;
    }

    return null;
  }

  bytesTitle(): string | null {
    const value = this.primitiveNumber();
    return value === null ? null : `${this.formatNumber(value)} bytes`;
  }

  codeText(): string {
    const value = this.value();
    if (this.hasType(value, 'code')) {
      return this.asDisplayText(value.value);
    }

    return this.stringValue();
  }

  linkText(): string {
    const value = this.value();
    if (this.hasType(value, 'link')) {
      return value.text;
    }

    return this.stringValue();
  }

  linkUrl(): string | null {
    const value = this.value();
    if (this.hasType(value, 'link') && this.isNavigableUrl(value.url)) {
      return value.url;
    }

    return null;
  }

  nodeValue(): Details.NodeValue | null {
    const value = this.value();
    return this.hasType(value, 'node') ? value : null;
  }

  numericText(): string {
    const value = this.value();
    if (this.hasType(value, 'numeric')) {
      return this.formatNumber(value.value, value.granularity);
    }

    return this.formatNumber(this.primitiveNumber() ?? 0, this.heading()?.granularity);
  }

  sourceLocationText(): string {
    const value = this.value();
    if (!this.hasType(value, 'source-location')) {
      return this.stringValue();
    }

    const generatedLocation = `${value.url}:${value.line + 1}:${value.column}`;

    if (value.urlProvider === 'network' && value.original) {
      const file = value.original.file || '<unmapped>';
      return `${file}:${value.original.line + 1}:${value.original.column}`;
    }

    if (value.urlProvider === 'network') {
      return generatedLocation;
    }

    if (value.original) {
      const file = value.original.file || '<unmapped>';
      return `${file}:${value.original.line + 1}:${value.original.column} (from source map)`;
    }

    return `${generatedLocation} (from sourceURL)`;
  }

  sourceLocationTitle(): string | null {
    const value = this.value();
    if (!this.hasType(value, 'source-location')) {
      return null;
    }

    if (value.urlProvider === 'network' && value.original) {
      return `maps to generated location ${value.url}:${value.line + 1}:${value.column}`;
    }

    return null;
  }

  sourceLocationHref(): string | null {
    const value = this.value();
    return this.hasType(value, 'source-location') && value.urlProvider === 'network'
      ? value.url
      : null;
  }

  sourceLocationDataUrl(): string | null {
    const value = this.value();
    return this.hasType(value, 'source-location') ? value.url : null;
  }

  sourceLocationDataLine(): number | null {
    const value = this.value();
    return this.hasType(value, 'source-location') ? value.line : null;
  }

  sourceLocationDataColumn(): number | null {
    const value = this.value();
    return this.hasType(value, 'source-location') ? value.column : null;
  }

  textValue(): string {
    const value = this.value();
    if (this.hasType(value, 'text')) {
      return this.asDisplayText(value.value);
    }

    return this.stringValue();
  }

  thumbnailSrc(): string {
    return this.stringValue();
  }

  urlHref(): string | null {
    const value = this.value();
    if (this.hasType(value, 'url') && this.isNavigableUrl(value.value)) {
      return value.value;
    }

    const stringValue = this.stringValue();
    return this.isNavigableUrl(stringValue) ? stringValue : null;
  }

  urlDisplayText(): string {
    const href = this.urlHref();
    if (!href) {
      return this.stringValue();
    }

    try {
      const parsed = new URL(href);
      const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      return path === '/' ? parsed.origin : path;
    } catch {
      return href;
    }
  }

  urlHostText(): string | null {
    const href = this.urlHref();
    if (!href) {
      return null;
    }

    try {
      const parsed = new URL(href);
      const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      if (!parsed.hostname || path === '/') {
        return null;
      }

      return `(${parsed.hostname})`;
    } catch {
      return null;
    }
  }

  stringValue(): string {
    const value = this.value();
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (this.hasType(value, 'code') || this.hasType(value, 'numeric') || this.hasType(value, 'text') || this.hasType(value, 'url')) {
      return String(value.value);
    }

    if (this.hasType(value, 'link')) {
      return value.text;
    }

    if (this.hasType(value, 'node')) {
      return value.nodeLabel || value.snippet || value.selector || '';
    }

    if (this.hasType(value, 'source-location')) {
      return this.sourceLocationText();
    }

    if (this.isIcuMessage(value)) {
      return value.formattedDefault;
    }

    return '';
  }

  formatBytes(value: number, granularity = 0.1): string {
    return `${this.formatNumber(value / 1024, granularity)} KiB`;
  }

  formatMilliseconds(value: number, granularity = 10, displayUnit?: string): string {
    if (displayUnit === 'duration') {
      return this.formatDuration(value);
    }

    return `${this.formatNumber(value, granularity)} ms`;
  }

  formatNumber(value: number, granularity = 0.1): string {
    const fractionDigits = this.fractionDigits(granularity);

    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: 0,
    }).format(value);
  }

  private fractionDigits(granularity: number): number {
    if (!Number.isFinite(granularity) || granularity >= 1) {
      return 0;
    }

    const asString = String(granularity);
    const decimal = asString.includes('.') ? asString.split('.')[1] : '';
    return decimal.length;
  }

  private formatDuration(timeInMilliseconds: number): string {
    let timeInSeconds = timeInMilliseconds / 1000;
    if (Math.round(timeInSeconds) === 0) {
      return 'None';
    }

    const parts: string[] = [];
    const units = [
      ['day', 60 * 60 * 24],
      ['hour', 60 * 60],
      ['minute', 60],
      ['second', 1],
    ] as const;

    units.forEach(([unit, secondsPerUnit]) => {
      const numberOfUnits = Math.floor(timeInSeconds / secondsPerUnit);
      if (numberOfUnits <= 0) {
        return;
      }

      timeInSeconds -= numberOfUnits * secondsPerUnit;
      parts.push(
        new Intl.NumberFormat('en-US', {
          style: 'unit',
          unit,
          unitDisplay: 'narrow',
          maximumFractionDigits: 0,
        }).format(numberOfUnits),
      );
    });

    return parts.join(' ');
  }

  private isNavigableUrl(value: string): boolean {
    return URL_PREFIXES.some((prefix) => value.startsWith(prefix));
  }

  private asDisplayText(value: string | IcuMessage): string {
    return typeof value === 'string' ? value : value.formattedDefault;
  }

  private typedValueType(value: Details.ItemValue | undefined): TypedValueType | null {
    return typeof value === 'object' && value !== null && 'type' in value
      ? (value as TypedValue).type
      : null;
  }

  private hasType<TType extends TypedValueType>(
    value: Details.ItemValue | undefined,
    type: TType,
  ): value is Extract<TypedValue, { type: TType }> {
    return this.typedValueType(value) === type;
  }

  private isIcuMessage(value: Details.ItemValue | undefined): value is Extract<Details.ItemValue, { formattedDefault: string }> {
    return typeof value === 'object' && value !== null && 'formattedDefault' in value && typeof value.formattedDefault === 'string';
  }
}
