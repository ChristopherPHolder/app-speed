import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { AuditLifecycleStatusComponent } from '@app-speed/audit/portal/ui';
import { AuditProgressService } from '@app-speed/audit/user-flow/portal-data-access';

import { AuditViewerContainer } from './audit-viewer.container';

@Component({
  selector: 'user-flow-audit-page',
  imports: [AuditLifecycleStatusComponent, AuditViewerContainer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (stage() === 'done') {
      <viewer-container [auditId]="id()" />
    } @else {
      <ui-audit-lifecycle-status [auditId]="id()" [stage]="stage()" [queuePosition]="queuePosition()" />
    }
  `,
})
export class UserFlowAuditPageComponent {
  readonly id = input.required<string>();
  private readonly progress = inject(AuditProgressService);
  readonly stage = toSignal(this.progress.stageName$, { initialValue: 'scheduling' });
  readonly queuePosition = toSignal(this.progress.queuePosition$, { initialValue: null });

  constructor() {
    effect(() => this.progress.watchAudit(this.id()));
  }
}
