import { Component, inject } from '@angular/core';
import { AuditBuilderContainer } from './audit-builder/audit-builder.container';
import { RxIf } from '@rx-angular/template/if';
import { RxPush } from '@rx-angular/template/push';
import { SchedulerService } from '@app-speed/portal-data-access';
import { AuditViewerContainer } from './container/audit-viewer.container';
import { StageIndicatorComponent } from './stage-indicator.component';

@Component({
  selector: 'lib-user-flow',
  template: `
    <builder-form />

    @defer {
      <viewer-container *rxIf="scheduler.key$; let key" [auditId]="key" />

      <stage-indicator-component *rxIf="scheduler.shouldDisplayIndicator$" [stageName]="scheduler.stageName$ | push" />
    }
  `,
  styles: `
    :host {
      display: block;
      max-width: 960px;
      margin: auto;
    }
  `,
  imports: [AuditBuilderContainer, RxIf, AuditViewerContainer, StageIndicatorComponent, RxPush],
})
export class UserFlowComponent {
  public readonly scheduler = inject(SchedulerService);
}
