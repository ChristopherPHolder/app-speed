import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { StatusBadgeComponent, StatusOptions, STATUS_COLOR } from '@app-speed/ui/status-badge';
import { MatButton } from '@angular/material/button';
import { StatusChipComponent } from '@app-speed/ui/status-chip';
import { MdToAnkerPipe } from './md-to-anker.pipe';

export type MetricSummary = {
  name: string;
  value: string | undefined;
  description: string;
  status: StatusOptions;
  errorMessage?: string;
};

@Component({
  selector: 'viewer-step-metric-summary',
  template: `
    <div class="header">
      <div class="header-title">
        <h3>Metrics</h3>
        @if (softNavigation()) {
          <ui-status-chip class="experimental-metrics" tone="warning" role="note"
            >Experimental soft navigation</ui-status-chip
          >
        }
      </div>
      <button matButton type="button" class="header-toggle" (click)="toddleDescriptionVisibility()">
        {{ toggleBtnText() }} view
      </button>
    </div>
    <div class="content">
      @for (metric of metricSummary(); track metric.name) {
        <div class="item">
          <div class="item-header">
            <ui-status-badge class="header-icon" [status]="metric.status" />
            <div class="header-name">{{ metric.name }}</div>
            <div class="header-value" [style.color]="STATUS_COLOR[metric.status]">{{ metric.value }}</div>
          </div>
          @if (metric.errorMessage) {
            <p class="metric-error">{{ metric.errorMessage }}</p>
          }
          @if (descriptionVisible()) {
            <div class="metric-description" [innerHTML]="metric.description | mdToAnker"></div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding: var(--ui-space-5);
    }

    .header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ui-space-2) var(--ui-space-3);
      justify-content: space-between;
      margin: var(--ui-space-2) 0;
    }

    .header-title {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ui-space-2);
    }

    h3 {
      margin: 0;
      font: var(--mat-sys-title-medium);
    }

    .header-toggle {
      margin-inline-start: auto;
    }

    .content {
      display: grid;
      grid-template-columns: 1fr;
      @media (width >= 840px) {
        grid-template-columns: 1fr 1fr;
        gap: 0 var(--ui-space-8);
      }
    }

    .item {
      padding: var(--ui-space-4) var(--ui-space-2);
      border-top: 1px solid var(--mat-sys-outline-variant);
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-icon {
      padding-inline-end: var(--ui-space-3);
    }

    .header-name {
      font: var(--mat-sys-title-small);
    }

    .header-value {
      margin-inline-start: auto;
      font: var(--mat-sys-title-medium);
      font-variant-numeric: tabular-nums;
    }

    .metric-error,
    .metric-description {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }

    .metric-description {
      margin: var(--ui-space-4) 0;
    }
  `,
  imports: [MatButton, StatusBadgeComponent, StatusChipComponent, MdToAnkerPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerStepMetricSummaryComponent {
  metricSummary = input.required<MetricSummary[]>();
  softNavigation = input(false);
  readonly descriptionVisible = signal(false);
  readonly toggleBtnText = computed(() => (this.descriptionVisible() ? 'Collapse' : 'Expand'));
  toddleDescriptionVisibility(): void {
    this.descriptionVisible.update((value) => !value);
  }
  protected STATUS_COLOR = STATUS_COLOR;
}
