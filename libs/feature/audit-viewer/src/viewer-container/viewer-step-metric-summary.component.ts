import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { MatTable } from '@angular/material/table';
import { MatDivider } from '@angular/material/divider';
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
    <div class='metrics-menu'>
      <span>METRICS</span>
      <div (click)='toddleDescriptionVisibility()'>Expand view</div>
    </div>
    <div class='metrics-wrapper'>
      @for (metric of metricSummary(); track metric.name) {
        <div class='metric-wrapper'>
          <mat-divider />
          <div style='margin: 12px'>
            <div class='metric-container'>
              <div class='metric-item' style='margin: 8px;'>
                <!--  @TODO move to separate component -->
                @switch (metric.colorCode) {
                  @case ('green') {
                    <mat-icon style="color:green;">circle</mat-icon>
                  }
                  @case ('orange') {
                    <mat-icon style="color:orange;">square</mat-icon>
                  }
                  @case ('red') {
                    <mat-icon style="color:red;">warning</mat-icon>
                  }
                }
              </div>
              <div class='metric-item' style='font-size: medium;'>{{ metric.name }}</div>
              <div class='metric-item' style='font-size: large; font-weight: 500;' [style.color]='metric.colorCode'>
                {{ metric.value }}
              </div>
    
            </div>
            @if (displayDescription()) {
              <div style='margin: 8px;'>
                {{ metric.description }}
                <a [href]='metric.reference?.link'>{{ metric.reference?.text }}</a>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  standalone: true,
  imports: [
    JsonPipe,
    MatTable,
    MatDivider,
    MatIcon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        max-width: 900px;
        margin: auto;
    }
    .metrics-menu {
        display: flex;
        justify-content: space-between;
        padding: 8px 32px;
        width: 100%;
    }
    .metrics-wrapper {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
    }
    .metric-wrapper {
        min-width: 300px;
        max-width: 500px;
        width: 100%;
        margin: 0 16px;
    }
    .metric-container {
        display: flex;
        width: 100%;
        align-items: center;
    }
    .metric-item:last-of-type {
        margin-left: auto;
    }
  `]
})
export class ViewerStepMetricSummaryComponent {
  metricSummary = input.required<MetricSummary[]>();
  readonly displayDescription = signal(false);
  toddleDescriptionVisibility(): void {
    this.displayDescription.update((value) => !value);
  }
}
