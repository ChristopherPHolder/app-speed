import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { RADIAL_CHART_COLOR, RADIAL_CHART_SIZE, RadialChartColor, RadialChartSize } from './radial-chart.types';

@Component({
  selector: 'app-radial-chart',
  standalone: true,
  template: `
      <div class="radial-chart {{getColorScheme()}} {{size}}">
          <svg viewBox="0 0 100 100" >
              <circle cx="50" cy="50" r="45" class="background" />
              <circle cx="50" cy="50" r="45" class="progress" [attr.stroke-dashoffset]="getOffset()"/>
          </svg>
          <span class="score-text">{{ score }}</span>
      </div>
  `,
  styleUrls: ['./radial-chart.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadialChartComponent {
  @Input() public score = 0;
  @Input() public size: RadialChartSize = RADIAL_CHART_SIZE.MEDIUM;

  getColorScheme(): RadialChartColor {
    if (this.score > 90) return RADIAL_CHART_COLOR.GREEN;
    if (this.score > 50) return RADIAL_CHART_COLOR.ORANGE;
    return RADIAL_CHART_COLOR.RED;
  }
  getOffset(): number {
    const progress = (100 - this.score) / 100 ;
    const circumference = 2 * Math.PI * 45;
    return progress * circumference;
  }
}
