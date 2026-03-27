import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuditRunSummary } from '../api/audit-runs.models';

@Component({
  selector: 'ui-audit-run-details',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatProgressSpinnerModule],
  template: `
    <section class="audit-run-details">
      <div class="page-actions">
        <button type="button" mat-stroked-button (click)="backClicked.emit()">Back to Audit Runs</button>
      </div>

      @if (loading) {
        <div class="loading-state">
          <mat-spinner diameter="28" />
          <span>Loading run details...</span>
        </div>
      }

      @if (errorMessage; as errorMessage) {
        <mat-card appearance="outlined">
          <mat-card-content>
            <p class="state-message">{{ errorMessage }}</p>
          </mat-card-content>
        </mat-card>
      }

      @if (run; as run) {
        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>{{ run.title }}</mat-card-title>
            <mat-card-subtitle>{{ run.auditId }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="details-content">
            <dl class="details">
              <div>
                <dt>Status</dt>
                <dd>{{ run.status }}</dd>
              </div>
              <div>
                <dt>Result Status</dt>
                <dd>{{ run.resultStatus ?? 'PENDING' }}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{{ run.createdAt | date: 'medium' }}</dd>
              </div>
              <div>
                <dt>Started</dt>
                <dd>{{ run.startedAt ? (run.startedAt | date: 'medium') : 'N/A' }}</dd>
              </div>
              <div>
                <dt>Completed</dt>
                <dd>{{ run.completedAt ? (run.completedAt | date: 'medium') : 'N/A' }}</dd>
              </div>
              <div>
                <dt>Queue Position</dt>
                <dd>{{ run.queuePosition ?? 'N/A' }}</dd>
              </div>
              <div>
                <dt>Duration (ms)</dt>
                <dd>{{ run.durationMs ?? 'N/A' }}</dd>
              </div>
            </dl>
          </mat-card-content>
        </mat-card>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .audit-run-details {
      max-width: 960px;
      margin: 24px auto;
      padding: 0 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .page-actions {
      display: flex;
    }

    .loading-state {
      display: inline-flex;
      align-items: center;
      gap: 12px;
    }

    .details-content {
      padding-top: 16px;
    }

    .state-message {
      margin: 0;
    }

    .details {
      margin: 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .details div {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    dt {
      font-size: 0.875rem;
      font-weight: 500;
    }

    dd {
      margin: 0;
      font-size: 1rem;
    }

    @media (max-width: 768px) {
      .audit-run-details {
        margin: 16px auto;
        padding: 0 12px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditRunDetailsComponent {
  @Input() run: AuditRunSummary | null = null;
  @Input() loading = false;
  @Input() errorMessage: string | null = null;

  @Output() backClicked = new EventEmitter<void>();
}
