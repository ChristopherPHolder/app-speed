import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditBuilderComponent, ResultsDisplayComponent } from 'ui';
import { RxState } from '@rx-angular/state';
import { SimpleAuditAdapter } from './simple-audit.adapter';
import { AuditStatusType } from 'shared';
import { map, startWith, tap } from 'rxjs';
import { RxIf } from '@rx-angular/template/if';
import { RxActionFactory } from '@rx-angular/state/actions';

type ContainerState = {
  progress: AuditStatusType;
  // @TODO remove optional as state is lazy
  htmlReportUrl?: string;
  isOnline: boolean;
}

type UiActions = {
  submit: string;
}

@Component({
  selector: 'app-simple-audit',
  standalone: true,
  imports: [CommonModule, ResultsDisplayComponent, RxIf, AuditBuilderComponent],
  template: `
    <div class='audit-heading-container box--medium'>
      <h1 class='box--medium'>User Flow Audit</h1>
      <div class='box--small'>Beyond First Impressions: Measure your apps performance on user interactions</div>
    </div>
    <app-audit-builder (auditSubmit)='checkSubmit($event)' [disabled]="state.select('isOnline')"/>

    <ui-results-display
      *rxIf='resultsBoxVisible$'
      [htmlReportUrl]="state.select('htmlReportUrl')"
      [progress]="state.select('progress')"
    />
  `,
  styleUrls: ['./simple-audit.container.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState, RxActionFactory],
})
export class SimpleAuditContainer {

  checkSubmit(event: any) {
    console.log('Submited', event);
  }

  ui = this.actions.create();
  resultsBoxVisible$ = this.state.select(map(({ progress }) => progress !== 'idle'));

  constructor(
    private actions: RxActionFactory<UiActions>,
    private adapter: SimpleAuditAdapter,
    public state: RxState<ContainerState>,
  ) {
    this.state.connect(
      'htmlReportUrl',
      this.adapter.results$.pipe(map(({ htmlReportUrl }) => htmlReportUrl)),
    );
    this.state.connect(
      'progress',
      this.adapter.progress$.pipe(startWith('idle' as AuditStatusType)),
    );
    this.state.connect('isOnline', this.adapter.isOnline$);

    this.adapter.initHandleAudit(this.ui.submit$.pipe(tap(i=>console.log('!!!!!!!!!!!', i))));
  }
}
