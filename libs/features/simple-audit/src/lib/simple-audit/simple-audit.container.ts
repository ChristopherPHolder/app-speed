import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResultsDisplayComponentModule, UserFlowFormComponent } from 'core-ui';
import { RxState } from '@rx-angular/state';
import { SimpleAuditAdapter } from './simple-audit.adapter';
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { ResultProgress } from 'shared';
import { map } from 'rxjs';

type ContainerState = {
  progress: ResultProgress;
  htmlReportUrl?: string;
}

@Component({
  selector: 'app-simple-audit',
  standalone: true,
  imports: [CommonModule, UserFlowFormComponent, ResultsDisplayComponentModule],
  templateUrl: './simple-audit.container.html',
  styleUrls: ['./simple-audit.container.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState]
})
export class SimpleAuditContainer {
  constructor(
    private adapter: SimpleAuditAdapter,
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
  runAudit(auditUrl: string) {
    this.adapter.handleAudit(auditUrl);
  }
}
