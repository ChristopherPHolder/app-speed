import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResultViewerAdapter } from './result-viewer.adapter';
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { ResultsDisplayComponentModule } from 'core-ui';
import { RxState } from '@rx-angular/state';
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { ResultProgress } from 'shared';
import { map } from 'rxjs';

type ContainerState = {
  progress: ResultProgress;
  htmlReportUrl?: string;
}
@Component({
  selector: 'app-features-result-viewer',
  standalone: true,
  imports: [CommonModule, ResultsDisplayComponentModule],
  templateUrl: './result-viewer.container.html',
  styleUrls: ['./result-viewer.container.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState]
})
export class ResultViewerContainer {

  constructor(
    private adapter: ResultViewerAdapter,
    public state: RxState<ContainerState>
  ) {
    this.state.connect(
      'htmlReportUrl',
      this.adapter.results$.pipe(map(({ htmlReportUrl }) => htmlReportUrl))
    )
    this.state.connect(
      'progress',
      this.adapter.progress$
    )

  }
}
