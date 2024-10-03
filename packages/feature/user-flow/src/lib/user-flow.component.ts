import { Component, inject } from '@angular/core';
import { AuditBuilderContainer } from '@app-speed/feature/audit-builder';
import { MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RxIf } from '@rx-angular/template/if';
import { RxPush } from '@rx-angular/template/push';
import { SchedulerService } from '@app-speed/portal-data-access';
import { AuditViewerContainer } from '@app-speed/feature/audit-viewer';
import { StageIndicatorComponent } from './stage-indicator.component';

@Component({
  selector: 'lib-user-flow',
  standalone: true,
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
  imports: [
    AuditBuilderContainer,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardSubtitle,
    MatCardTitle,
    MatProgressSpinner,
    RxIf,
    AuditViewerContainer,
    StageIndicatorComponent,
    RxPush,
  ],
})
export class UserFlowComponent {
  public readonly scheduler = inject(SchedulerService);
}
