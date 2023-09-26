import { ChangeDetectionStrategy, Component, ViewEncapsulation, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeResourceUrl } from '@angular/platform-browser';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { map, Observable } from 'rxjs';
import { AuditStatusType, BypassSrcDirective} from 'shared';
import { RxState } from '@rx-angular/state';
import { RxIf } from '@rx-angular/template/if';
import { RxPush } from '@rx-angular/template/push';
import { ProgressToasterComponent } from '../progress-toaster/progress-toaster.component';

type ComponentState = {
  progress: AuditStatusType;
  toastText: string;
  htmlReportUrl?: SafeResourceUrl;
}
@Component({
  selector: 'app-results-display',
  standalone: true,
  imports: [
    CommonModule,
    BypassSrcDirective,
    LoadingSpinnerComponent,
    ProgressToasterComponent,
    RxPush,
    RxIf,
  ],
  template: `
    <div class='audit-results-box'>
      <app-progress-toaster
        *rxIf='toasterTextVisible$'
        [progress]="state.select('progress')"
      ></app-progress-toaster>
      <iframe
        *rxIf="state.select('htmlReportUrl')"
        [bypassSrc]="state.select('htmlReportUrl') | push"
        class='html-report-iframe'
        title='User-Flow Results'
      ></iframe>
      <app-loading-spinner
        *rxIf='loadingSpinnerVisible$'
      ></app-loading-spinner>
    </div>
  `,
  styleUrls: ['./results-display.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState]
})
export class ResultsDisplayComponent {

  toasterTextVisible$ = this.state.select(map(({progress}) => progress !== 'done'))
  loadingSpinnerVisible$ = this.state.select(map(({progress}) => !['idle', 'done', 'failed'].includes(progress)));

  @Input() set progress (progress$: Observable<AuditStatusType>) {
    this.state.connect('progress', progress$);
  }
  @Input() set htmlReportUrl (htmlReportUrl$: Observable<string | undefined>) {
    this.state.connect('htmlReportUrl', htmlReportUrl$);
  }
  constructor(
    public state: RxState<ComponentState>,
  ) {}
}
