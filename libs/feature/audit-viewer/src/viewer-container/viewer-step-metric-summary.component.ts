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
    <section style='margin: 20px'>
      <div style='display: flex; justify-content: space-between; margin: 8px;'>
        <div>
          METRICS
        </div>
        <div (click)='toddleDescriptionVisibility()'>
          Expand view
        </div>
      </div>
      @for (metric of metricSummary(); track metric.name) {
        <mat-divider />
        <div style='margin: 12px'>
          <div style='display: flex;'>
            <div style='margin: 8px;'>
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
            <div>
              <div style='font-size: medium;'>{{ metric.name }}</div>
              <div style='font-size: large; font-weight: 500; margin: 5px 0;' [style.color]='metric.colorCode'>
                {{ metric.value }}
              </div>
              @if (displayDescription()) {
                <div>
                  {{ metric.description }} 
                  <a [href]='metric.reference?.link'>{{ metric.reference?.text }}</a>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </section>
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
  `]
})
export class ViewerStepMetricSummaryComponent {
  metricSummary = input.required<MetricSummary[]>();
  readonly displayDescription = signal(false);
  toddleDescriptionVisibility(): void {
    this.displayDescription.update((value) => !value);
  }
}
