import { ChangeDetectionStrategy, Component, computed, input, numberAttribute, ViewEncapsulation } from '@angular/core';
import { RADIAL_CHART_COLOR, RADIAL_CHART_SIZE, RadialChartColor, RadialChartSize } from './radial-chart.types';

@Component({
  selector: 'ui-radial-chart',
  standalone: true,
  template: `
    <svg viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" class="background" />
      <circle cx="50" cy="50" r="45" class="progress" [attr.stroke-dashoffset]="offset()" />
    </svg>
    <span class="score-text">{{ score() }}</span>
  `,
  host: { '[class]': `class()` },
  styles: `
    :host {
      --radial-chart-color: var(--mat-sys-error);
      position: relative;
      display: inline-flex;
      color: var(--radial-chart-color);
      font: var(--mat-sys-title-medium);
      font-variant-numeric: tabular-nums;
      align-items: center;
      justify-content: center;
    }
    :host(.green) {
      --radial-chart-color: var(--ui-success);
    }
    :host(.orange) {
      --radial-chart-color: var(--ui-warning);
    }
    svg {
      width: 50px;
      height: 50px;
      transform: rotate(-90deg);
    }
    :host(.sm) {
      font: var(--mat-sys-label-small);
    }
    :host(.sm) svg {
      width: 25px;
      height: 25px;
    }
    :host(.lg) {
      font: var(--mat-sys-headline-large);
    }
    :host(.lg) svg {
      width: 100px;
      height: 100px;
    }
    .score-text {
      position: absolute;
    }
    .background,
    .progress {
      stroke: var(--radial-chart-color);
      stroke-width: 8;
    }
    .background {
      fill: var(--radial-chart-color);
      opacity: 0.12;
    }
    .progress {
      fill: none;
      stroke-dasharray: 282.743;
      stroke-linecap: round;
      transition: stroke-dashoffset var(--ui-motion-duration-medium2) var(--ui-motion-easing-standard);
    }
    @media (prefers-reduced-motion: reduce) {
      .progress {
        transition: none;
      }
    }
  `,
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadialChartComponent {
  readonly score = input(0, { transform: numberAttribute });
  readonly size = input<RadialChartSize>(RADIAL_CHART_SIZE.MEDIUM);
  readonly color = computed<RadialChartColor>(() => {
    const score = this.score();
    if (score > 90) return RADIAL_CHART_COLOR.GREEN;
    if (score > 50) return RADIAL_CHART_COLOR.ORANGE;
    return RADIAL_CHART_COLOR.RED;
  });
  readonly class = computed<string>(() => `${this.color()} ${this.size()}`);
  readonly offset = computed<number>(() => {
    const progress = (100 - this.score()) / 100;
    const circumference = 2 * Math.PI * 45;
    return progress * circumference;
  });
}
