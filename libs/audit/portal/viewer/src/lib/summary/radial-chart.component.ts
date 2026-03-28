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
  styleUrls: ['./radial-chart.component.scss'],
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
