import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RadialChartComponent } from '@app-speed/portal-ui/radial-chart';
import { Result } from 'lighthouse';

@Component({
  selector: 'viewer-score',
  template: `
    @if (category()?.['score']; as score) {
      <ui-radial-chart style="position: relative;" [score]="score * 100" />
    } @else {
      <mat-icon>horizontal_rule</mat-icon>
    }
  `,
  imports: [MatIcon, RadialChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerScoreComponent {
  category = input<Result.Category | undefined>();
}
