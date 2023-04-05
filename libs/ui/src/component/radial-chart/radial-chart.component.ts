import { Component, Input, ViewEncapsulation } from '@angular/core';

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
})
export class RadialChartComponent {
  @Input() public score = 0;
  @Input() public size: 'sm' | 'md' | 'lg' = 'md';

  getColorScheme(): 'green' | 'orange' | 'red' {
    if (this.score > 90) return 'green';
    if (this.score > 50) return 'orange';
    return 'red';
  }
  getOffset(): number {
    const progress = (100 - 50) / 100 ;
    const circumference = 2 * Math.PI * 45;
    return progress * circumference;
  }
}
