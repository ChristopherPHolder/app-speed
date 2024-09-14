import { Component, inject } from '@angular/core';
import { AuditBuilderContainer } from '@app-speed/feature/audit-builder';
import { MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RxIf } from '@rx-angular/template/if';
import { SchedulerService } from '@app-speed/data-access';
import { AuditViewerContainer } from '@app-speed/feature/audit-viewer';
import { StageIndicatorComponent } from './stage-indicator.component';

@Component({
  selector: 'lib-user-flow',
  standalone: true,
  template: `
    <builder-form />

    <viewer-container *rxIf="scheduler.key$; let key" [auditId]="key" />

    @defer {
      <stage-indicator-component />
    }

    <div class="grid-container" *rxIf="scheduler.processing">
      <mat-card class="loading-card">
        <mat-card-header>
          <mat-card-title> Running Analysis </mat-card-title>
          <mat-card-subtitle> progress </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content [style.padding-top]="'16px'">
          <mat-spinner [diameter]="64" />
        </mat-card-content>
      </mat-card>
    </div>
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
  ],
})
export class UserFlowComponent {
  public readonly scheduler = inject(SchedulerService);
}
