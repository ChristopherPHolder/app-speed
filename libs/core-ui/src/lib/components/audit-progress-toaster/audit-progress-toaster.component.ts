import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { AuditProgressStatus } from 'shared';
import { map, Observable } from 'rxjs';

const progressMap: Record<AuditProgressStatus, string> = {
  idle: "",
  loading: "Loading the result",
  done: "",
  failed: "",
  scheduled: ""
}

@Component({
  selector: 'app-audit-progress-toaster',
  standalone: true,
  imports: [CommonModule],
  template: `<output>{{toasterText$ | async}}</output>`,
  styles: [`.toast-text { text-align: center; }`],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditProgressToasterComponent {
  public toasterText$!: Observable<string>;
  @Input() set progress (progress$: Observable<AuditProgressStatus>) {
    this.toasterText$ = progress$.pipe(map((progress) => {
      if (!(progress in progressMap)) {
        throw new Error(`State ${progress} not handled @AuditProgressToasterComponent`);
      }
      return progressMap[progress];
    }));
  }
}
