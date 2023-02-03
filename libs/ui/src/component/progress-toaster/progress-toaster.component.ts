import {ChangeDetectionStrategy, Component, Input, ViewEncapsulation} from '@angular/core';
import { CommonModule } from '@angular/common';
import {map, Observable} from 'rxjs';
import {AuditStatusType} from 'shared';

const progressMap: Record<Partial<AuditStatusType>, string> = {
  idle: '',
  scheduling: 'Audit is being scheduled',
  queued: 'The audit has been scheduled',
  loading: 'Downloading results from storage',
  done: '',
  failed: 'Sorry there was an error running the audit',
}

@Component({
  selector: 'app-progress-toaster',
  standalone: true,
  imports: [CommonModule],
  template: `<output class='toast-text' *rxLet='toasterText$; let toasterText'>{{toasterText}}</output>`,
  styles: [`.toast-text { text-align: center; display: block; }`],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressToasterComponent {
  public toasterText$!: Observable<string>;
  @Input() set progress (progress$: Observable<AuditStatusType>) {
    this.toasterText$ = progress$.pipe(map((progress) => {
      if (!(progress in progressMap)) {
        throw new Error(`State ${progress} not handled @AuditProgressToasterComponent`);
      }
      return progressMap[progress];
    }));
  }
}
