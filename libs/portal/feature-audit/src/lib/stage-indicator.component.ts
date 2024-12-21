import { Component, computed, input } from '@angular/core';
import {
  MatCard,
  MatCardContent,
  MatCardFooter,
  MatCardHeader,
  MatCardSubtitle,
  MatCardTitle,
} from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RxIf } from '@rx-angular/template/if';

@Component({
  selector: 'stage-indicator-component',
  imports: [
    RxIf,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatCardContent,
    MatProgressSpinner,
    MatCardFooter,
  ],
  template: `
    <div class="grid-container">
      <mat-card class="loading-card">
        <mat-card-header>
          <mat-card-title>{{ message().title }}</mat-card-title>
          <mat-card-subtitle>{{ message().subtitle }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content [style.padding-top]="'16px'">
          <mat-spinner [diameter]="64" />
        </mat-card-content>
        <mat-card-footer>
          <p><small>If this loader is confusing please opening a ticket with suggestions!</small></p>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: `
    .grid-container {
      margin: 20px;
    }

    .loading-card {
      align-items: center;
      text-align: center;
    }
  `,
})
export class StageIndicatorComponent {
  stageName = input.required<string>();
  message = computed(() => {
    const stage = this.stageName();
    if (stage === 'scheduling') {
      return { title: 'Scheduling Audit', subtitle: 'Adding the audit to our queue' };
    }
    if (stage === 'scheduled') {
      return { title: 'Scheduled Audit', subtitle: 'Audit will be executed as soon as the server is available' };
    }
    if (stage === 'running') {
      return { title: 'Running Audit', subtitle: 'Currently running audit, results will be available soon' };
    }
    if (stage === 'failed') {
      return {
        title: 'Audit Failed',
        subtitle: 'Audit Failed on server sorry still have not added proper error handling here!',
      };
    }
    // Default message
    return { title: 'Running Analysis', subtitle: 'progress' };
  });
}
