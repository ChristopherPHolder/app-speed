import { ChangeDetectionStrategy, Component, ViewEncapsulation, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeResourceUrl } from '@angular/platform-browser';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { map, Observable } from 'rxjs';
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { AuditRunStatus, ResultProgress, BypassSrcDirective} from 'shared';
import { RxState } from '@rx-angular/state';
import { AuditProgressToasterComponent } from '../audit-progress-toaster/audit-progress-toaster.component';
import { IfModule } from '@rx-angular/template/if';


type ComponentState = {
  progress: ResultProgress | AuditRunStatus;
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
    AuditProgressToasterComponent,
    IfModule
  ],
  templateUrl: './results-display.component.html',
  styleUrls: ['./results-display.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState]
})
export class ResultsDisplayComponent {

  toasterTextVisible$ = this.state.select(map(({progress}) => progress !== 'done'))
  loadingSpinnerVisible$ = this.state.select(
    map(({progress}) => progress !== ('idle' && 'done' && 'failed'))
  );

  @Input() set progress (progress$: Observable<ResultProgress | AuditRunStatus>) {
    this.state.connect('progress', progress$);
  }
  @Input() set htmlReportUrl (htmlReportUrl$: Observable<string | undefined>) {
    this.state.connect('htmlReportUrl', htmlReportUrl$);
  }
  constructor(
    public state: RxState<ComponentState>,
  ) {}
}
