import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResultViewerAdapter } from './result-viewer.adapter';
import { ResultsDisplayComponent } from 'ui';
import { RxState } from '@rx-angular/state';
import { AuditStatusType } from 'shared';
import { map } from 'rxjs';

type ContainerState = {
  progress: Partial<AuditStatusType>;
  htmlReportUrl?: string;
}
@Component({
  selector: 'app-features-result-viewer',
  standalone: true,
  imports: [CommonModule, ResultsDisplayComponent],
  templateUrl: './result-viewer.container.html',
  styleUrls: ['./result-viewer.container.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState]
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
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
