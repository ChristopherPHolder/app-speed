import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResultsDisplayComponent, UserFlowFormComponent } from 'core-ui';
import { RxState } from '@rx-angular/state';
import { SimpleAuditAdapter } from './simple-audit.adapter';
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { AuditRunStatus, ResultProgress } from 'shared';
import { map } from 'rxjs';
import { IfModule } from '@rx-angular/template/if';

type ContainerState = {
  progress: ResultProgress | AuditRunStatus;
  htmlReportUrl?: string;
}

@Component({
  selector: 'app-simple-audit',
  standalone: true,
  imports: [CommonModule, UserFlowFormComponent, ResultsDisplayComponent, IfModule],
  templateUrl: './simple-audit.container.html',
  styleUrls: ['./simple-audit.container.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState]
})
export class SimpleAuditContainer {
  resultsBoxVisible$ = this.state.select(map(({progress}) => progress !== 'idle'));
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
