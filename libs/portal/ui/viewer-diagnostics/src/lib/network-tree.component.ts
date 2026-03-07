import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type Details from 'lighthouse/types/lhr/audit-details';
import { ViewerDetailValueComponent } from './detail-value.component';

type CriticalNode = Details.SimpleCriticalRequestNode[string];
type NetworkNode = Details.NetworkNode[string];
type ChainNode = CriticalNode | NetworkNode;
type ChainEntry = { id: string; node: ChainNode };

@Component({
  selector: 'ui-viewer-network-tree',
  template: `
    <section class="chain">
      <div class="chain__summary">
        <div class="chain__eyebrow">Initial navigation</div>
        <div class="chain__metric">Maximum critical path latency: {{ formatMilliseconds(details().longestChain.duration) }}</div>
      </div>

      <ul class="chain__tree">
        @for (entry of rootEntries(); track entry.id) {
          <ng-container [ngTemplateOutlet]="nodeTemplate" [ngTemplateOutletContext]="{ $implicit: entry }" />
        }
      </ul>
    </section>

    <ng-template #nodeTemplate let-entry>
      <li class="chain__node">
        <div class="chain__row" [class.chain__row--longest]="isLongest(entry.node)">
          <div class="chain__node-value">
            <ui-viewer-detail-value [value]="urlValue(entry.node)" [heading]="urlHeading" />
          </div>

          @if (shouldShowMetrics(entry.node)) {
            <span class="chain__meta">- {{ formatMilliseconds(timingFor(entry.node)) }}, {{ formatBytes(transferSizeFor(entry.node)) }}</span>
          }
        </div>

        @if (childrenFor(entry.node).length) {
          <ul class="chain__children">
            @for (child of childrenFor(entry.node); track child.id) {
              <ng-container [ngTemplateOutlet]="nodeTemplate" [ngTemplateOutletContext]="{ $implicit: child }" />
            }
          </ul>
        }
      </li>
    </ng-template>
  `,
  styles: `
    .chain {
      padding: 16px;
      border: 1px solid color-mix(in srgb, var(--mat-sys-outline) 60%, white);
      border-radius: 12px;
      background: color-mix(in srgb, var(--mat-sys-surface-variant) 32%, white);
    }

    .chain__summary {
      margin-bottom: 16px;
    }

    .chain__eyebrow {
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.8125rem;
      font-style: italic;
    }

    .chain__metric {
      margin-top: 4px;
      font-weight: 600;
    }

    .chain__tree,
    .chain__children {
      display: grid;
      gap: 10px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .chain__children {
      margin-top: 10px;
      margin-left: 12px;
      padding-left: 16px;
      border-left: 1px solid color-mix(in srgb, var(--mat-sys-outline) 60%, white);
    }

    .chain__row {
      display: flex;
      gap: 8px;
      align-items: baseline;
      flex-wrap: wrap;
    }

    .chain__row--longest {
      color: color-mix(in srgb, var(--mat-sys-tertiary) 78%, black);
    }

    .chain__node-value {
      min-width: 0;
      flex: 1 1 16rem;
    }

    .chain__meta {
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.875rem;
      font-weight: 600;
      white-space: nowrap;
    }
  `,
  imports: [NgTemplateOutlet, ViewerDetailValueComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerNetworkTreeComponent {
  details = input.required<Details.CriticalRequestChain | Details.NetworkTree>();

  readonly rootEntries = computed(() => this.entries(this.details().chains));
  readonly urlHeading: Details.TableColumnHeading = {
    key: 'url',
    label: 'URL',
    valueType: 'url',
  };

  childrenFor(node: ChainNode): ChainEntry[] {
    return this.entries(node.children);
  }

  isLongest(node: ChainNode): boolean {
    return this.isNetworkNode(node) && !!node.isLongest;
  }

  shouldShowMetrics(node: ChainNode): boolean {
    return !this.isCriticalNode(node) || this.childrenFor(node).length === 0;
  }

  timingFor(node: ChainNode): number {
    if (this.isCriticalNode(node)) {
      return (node.request.endTime - node.request.startTime) * 1000;
    }

    return node.navStartToEndTime;
  }

  transferSizeFor(node: ChainNode): number {
    return this.isCriticalNode(node) ? node.request.transferSize : node.transferSize;
  }

  urlValue(node: ChainNode): Details.UrlValue {
    return {
      type: 'url',
      value: this.isCriticalNode(node) ? node.request.url : node.url,
    };
  }

  formatMilliseconds(value: number): string {
    return `${Math.round(value)} ms`;
  }

  formatBytes(value: number): string {
    return `${Math.round(value / 1024)} KiB`;
  }

  private entries(nodes?: Details.SimpleCriticalRequestNode | Details.NetworkNode): ChainEntry[] {
    if (!nodes) {
      return [];
    }

    return Object.entries(nodes).map(([id, node]) => ({ id, node }));
  }

  private isCriticalNode(node: ChainNode): node is CriticalNode {
    return 'request' in node;
  }

  private isNetworkNode(node: ChainNode): node is NetworkNode {
    return 'url' in node;
  }
}
