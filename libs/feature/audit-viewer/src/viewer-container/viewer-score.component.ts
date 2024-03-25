import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RadialChartComponent } from 'ui';
import { Result } from 'lighthouse';

@Component({
  selector: 'lib-viewer-score',
  template: `
    @if (category()?.["score"]; as score) {
      <ui-radial-chart style='position: relative;' [score]='score * 100' />
    } @else {
        <mat-icon>horizontal_rule</mat-icon>
    }
  `,
  standalone: true,
  imports: [
    MatIcon,
    RadialChartComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewerScoreComponent {
  category = input<Result.Category | undefined>()
}
