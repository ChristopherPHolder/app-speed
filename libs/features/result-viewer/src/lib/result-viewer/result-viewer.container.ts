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
  template: `
    <ui-results-display [htmlReportUrl]="state.select('htmlReportUrl')" [progress]="state.select('progress')" />
  `,
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
