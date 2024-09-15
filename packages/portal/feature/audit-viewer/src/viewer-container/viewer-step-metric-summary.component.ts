import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { StatusBadgeComponent, StatusOptions, STATUS_COLOR } from '@portal/ui/status-badge';
import { MdToAnkerPipe } from '../utils/md-to-anker.pipe';

export type MetricSummary = {
  name: string;
  value: string | undefined;
  description: string;
  status: StatusOptions;
};

@Component({
  selector: 'viewer-step-metric-summary',
  template: `
    <div class="header">
      <span>METRICS</span>
      <div (click)="toddleDescriptionVisibility()">{{ toggleBtnText() }} view</div>
    </div>
    <div class="content">
      @for (metric of metricSummary(); track metric.name) {
        <div class="item">
          <div class="item-header">
            <ui-status-badge class="header-icon" [status]="metric.status" />
            <div class="header-name">{{ metric.name }}</div>
            <div class="header-value" [style.color]="STATUS_COLOR[metric.status]">{{ metric.value }}</div>
          </div>
          @if (descriptionVisible()) {
            <div style="margin: 16px 0;" [innerHTML]="metric.description | mdToAnker"></div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .header {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
    }

    .content {
      display: grid;
      grid-template-columns: 1fr;
      @media (min-width: 768px) {
        grid-template-columns: 1fr 1fr;
        gap: 0 32px;
      }
    }

    .item {
      border-top: 1px solid #ccc;
      padding: 16px 8px;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-icon {
      padding: 0 10px 0 0;
    }

    .header-name {
      font-size: medium;
      font-weight: 500;
    }
    .header-value {
      font-size: large;
      font-weight: 500;
      margin-left: auto;
    }
  `,
  standalone: true,
  imports: [MatIcon, StatusBadgeComponent, MdToAnkerPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerStepMetricSummaryComponent {
  metricSummary = input.required<MetricSummary[]>();
  readonly descriptionVisible = signal(false);
  readonly toggleBtnText = computed(() => (this.descriptionVisible() ? 'Collapse' : 'Expand'));
  toddleDescriptionVisibility(): void {
    this.descriptionVisible.update((value) => !value);
  }
  protected STATUS_COLOR = STATUS_COLOR;
}
