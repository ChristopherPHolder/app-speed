import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

export const COLOR_CODE = {
  RED: 'red',
  ORANGE: 'orange',
  GREEN: 'green',
} as const;

export type ColorCode = (typeof COLOR_CODE)[keyof typeof COLOR_CODE] | null;

export type Reference = {
  link: string;
  text: string;
} | null;

export type MetricSummary = {
  name: string;
  value: string | undefined;
  description: string;
  colorCode: ColorCode;
  reference: {
    link: string;
    text: string;
  } | null
}

@Component({
  selector: 'lib-viewer-step-metric-summary',
  template: `
    <div class='header'>
      <span>METRICS</span>
      <div (click)='toddleDescriptionVisibility()'>{{toggleBtnText()}} view</div>
    </div>
    <div class='content'>
      @for (metric of metricSummary(); track metric.name) {
        <div class='item'>
          <div class='item-header'>
            <!--  @TODO move to separate component -->
            @switch (metric.colorCode) {
              @case ('green') {
                <mat-icon style='color:green;'>circle</mat-icon>
              }
              @case ('orange') {
                <mat-icon style='color:orange;'>square</mat-icon>
              }
              @case ('red') {
                <mat-icon style='color:red;'>warning</mat-icon>
              }
            }
            <div style='font-size: medium;'>{{ metric.name }}</div>
            <div style='font-size: large; font-weight: 500;' [style.color]='metric.colorCode'>{{ metric.value }}</div>
          </div>
          @if (descriptionVisible()) {
            <div style='margin: 16px 0;'>
              {{ metric.description }}
              <a [href]='metric.reference?.link'>{{ metric.reference?.text }}</a>
            </div>
          }
        </div>
      }
    </div>
  `,
  standalone: true,
  imports: [JsonPipe, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
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
          margin: 0 0 16px 0;
          padding: 8px;
      }
      
      .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
      }
  `]
})
export class ViewerStepMetricSummaryComponent {
  metricSummary = input.required<MetricSummary[]>();
  readonly descriptionVisible = signal(false);
  readonly toggleBtnText = computed(() => this.descriptionVisible() ?  'Collapse' : 'Expand' );
  toddleDescriptionVisibility(): void {
    this.descriptionVisible.update((value) => !value);
  }
}
