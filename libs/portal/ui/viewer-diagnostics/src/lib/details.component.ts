import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type Details from 'lighthouse/types/lhr/audit-details';
import type { IcuMessage } from 'lighthouse/types/lhr/i18n';
import { ViewerChecklistComponent } from './checklist.component';
import { ViewerDetailNodeComponent } from './detail-node.component';
import { ViewerFilmstripComponent } from './filmstrip.component';
import { ViewerMarkdownTextComponent } from './markdown-text.component';
import { ViewerNetworkTreeComponent } from './network-tree.component';
import { ViewerTableComponent } from './table.component';
import { ViewerDiagnosticContext } from './viewer-diagnostic.models';

@Component({
  selector: 'ui-viewer-details',
  template: `
    @switch (details().type) {
      @case ('debugdata') {
      }
      @case ('criticalrequestchain') {
        <ui-viewer-network-tree [details]="$any(details())" />
      }
      @case ('treemap-data') {
      }
      @case ('filmstrip') {
        <ui-viewer-filmstrip [details]="filmstripDetails()" />
      }
      @case ('list') {
        <div class="detail-list">
          @for (item of listDetails().items; track $index) {
            @if (isListSection(item)) {
              <section class="detail-list__section">
                @if (item.title) {
                  <div class="detail-list__title">
                    <ui-viewer-markdown-text [text]="item.title" />
                  </div>
                }
                @if (item.description) {
                  <div class="detail-list__description">
                    <ui-viewer-markdown-text [text]="item.description" />
                  </div>
                }

                @if (isNodeValue(item.value)) {
                  <ui-viewer-detail-node [node]="item.value" [context]="context()" />
                } @else if (isTextValue(item.value)) {
                  <div>{{ asDisplayText(item.value.value) }}</div>
                } @else if (item.value.type !== 'debugdata') {
                  <ui-viewer-details [details]="$any(item.value)" [auditId]="auditId()" [context]="context()" />
                }
              </section>
            } @else if (isNodeValue(item)) {
              <ui-viewer-detail-node [node]="item" [context]="context()" />
            } @else if (isTextValue(item)) {
              <div>{{ asDisplayText(item.value) }}</div>
            } @else if (item.type !== 'debugdata') {
              <ui-viewer-details [details]="$any(item)" [auditId]="auditId()" [context]="context()" />
            }
          }
        </div>
      }
      @case ('checklist') {
        <ui-viewer-checklist [details]="checklistDetails()" />
      }
      @case ('opportunity') {
        <ui-viewer-table [tableDetails]="$any(details())" [auditId]="auditId()" [context]="context()" />
      }
      @case ('table') {
        <ui-viewer-table [tableDetails]="$any(details())" [auditId]="auditId()" [context]="context()" />
      }
      @case ('network-tree') {
        <ui-viewer-network-tree [details]="$any(details())" />
      }
      @case ('screenshot') {
      }
      @default {
        <details class="detail-unknown">
          <summary>Unsupported detail type: {{ details().type }}</summary>
          <pre>{{ unknownDetailsJson() }}</pre>
        </details>
      }
    }
  `,
  styles: `
    .detail-list {
      display: grid;
      gap: 16px;
    }

    .detail-list__section {
      display: grid;
      gap: 10px;
    }

    .detail-list__title {
      font-weight: 600;
    }

    .detail-list__description {
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.875rem;
    }

    .detail-unknown {
      border: 1px solid color-mix(in srgb, var(--mat-sys-outline) 60%, white);
      border-radius: 12px;
      padding: 12px 16px;
      background: color-mix(in srgb, var(--mat-sys-surface-variant) 24%, white);
    }

    .detail-unknown pre {
      margin: 12px 0 0;
      overflow: auto;
      white-space: pre-wrap;
    }
  `,
  imports: [
    ViewerTableComponent,
    ViewerFilmstripComponent,
    ViewerChecklistComponent,
    ViewerNetworkTreeComponent,
    ViewerDetailNodeComponent,
    ViewerMarkdownTextComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerDetailsComponent {
  details = input.required<Details>();
  auditId = input<string | null>(null);
  context = input<ViewerDiagnosticContext | null>(null);
  readonly listDetails = computed<Details.List>(() => this.details() as Details.List);
  readonly checklistDetails = computed<Details.Checklist>(() => this.details() as Details.Checklist);
  readonly filmstripDetails = computed<Details.Filmstrip>(() => this.details() as Details.Filmstrip);
  readonly unknownDetailsJson = computed(() => JSON.stringify(this.details(), null, 2));

  isListSection(
    item: Details.List['items'][number],
  ): item is Details.ListSectionItem {
    return item.type === 'list-section';
  }

  isNodeValue(value: unknown): value is Details.NodeValue {
    return typeof value === 'object' && value !== null && 'type' in value && value.type === 'node';
  }

  isTextValue(value: unknown): value is Details.TextValue {
    return typeof value === 'object' && value !== null && 'type' in value && value.type === 'text';
  }

  asDisplayText(value: string | IcuMessage): string {
    return typeof value === 'string' ? value : value.formattedDefault;
  }
}
