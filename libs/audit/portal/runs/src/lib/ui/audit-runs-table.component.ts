import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { AuditRunRow, AuditRunStatus, DEFAULT_AUDIT_RUN_FILTER } from './audit-runs.types';

@Component({
  selector: 'ui-audit-runs-table',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatCheckboxModule, MatProgressSpinnerModule, MatTableModule],
  template: `
    <section class="audit-runs">
      <mat-card appearance="outlined">
        <mat-card-content class="content">
          <header class="toolbar">
            <div class="toolbar-group">
              @for (status of statuses; track status) {
                <mat-checkbox [checked]="activeStatuses.includes(status)" (change)="statusToggled.emit(status)">
                  {{ status }}
                </mat-checkbox>
              }
            </div>

            <div class="toolbar-group">
              <button type="button" mat-stroked-button (click)="refreshClicked.emit()">Refresh</button>
              <button type="button" mat-stroked-button (click)="previousPage.emit()" [disabled]="!hasPreviousPage">
                Previous
              </button>
              <button type="button" mat-flat-button (click)="nextPage.emit()" [disabled]="!hasNextPage">Next</button>
            </div>
          </header>

          @if (loading) {
            <div class="loading-state">
              <mat-spinner diameter="24" />
              <span>Loading audit runs...</span>
            </div>
          }

          @if (errorMessage; as errorMessage) {
            <p class="state-message">{{ errorMessage }}</p>
          }

          <div class="table-container">
            <table mat-table [dataSource]="runs">
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let run">{{ run.status }}</td>
              </ng-container>

              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>Title</th>
                <td mat-cell *matCellDef="let run">{{ run.title }}</td>
              </ng-container>

              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef>Created</th>
                <td mat-cell *matCellDef="let run">{{ run.createdAt | date: 'medium' }}</td>
              </ng-container>

              <ng-container matColumnDef="durationMs">
                <th mat-header-cell *matHeaderCellDef>Duration (ms)</th>
                <td mat-cell *matCellDef="let run">{{ run.durationMs ?? 'N/A' }}</td>
              </ng-container>

              <ng-container matColumnDef="queuePosition">
                <th mat-header-cell *matHeaderCellDef>Queue</th>
                <td mat-cell *matCellDef="let run">{{ run.queuePosition ?? 'N/A' }}</td>
              </ng-container>

              <ng-container matColumnDef="resultStatus">
                <th mat-header-cell *matHeaderCellDef>Result</th>
                <td mat-cell *matCellDef="let run">{{ run.resultStatus ?? 'PENDING' }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr
                mat-row
                *matRowDef="let row; columns: displayedColumns"
                (click)="runSelected.emit(row)"
                class="clickable-row"
              ></tr>
            </table>
          </div>

          @if (!loading && runs.length === 0) {
            <p class="state-message">No audit runs found for the selected filters.</p>
          }
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .audit-runs {
      max-width: 1200px;
      margin: 24px auto;
      padding: 0 16px;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: space-between;
      align-items: center;
    }

    .toolbar-group {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    .table-container {
      overflow: auto;
    }

    table {
      width: 100%;
      min-width: 760px;
    }

    .clickable-row {
      cursor: pointer;
    }

    .loading-state {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }

    .state-message {
      margin: 0;
    }

    @media (max-width: 768px) {
      .audit-runs {
        margin: 16px auto;
        padding: 0 12px;
      }

      .toolbar {
        align-items: stretch;
      }

      .toolbar-group {
        width: 100%;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditRunsTableComponent {
  @Input({ required: true }) runs: ReadonlyArray<AuditRunRow> = [];
  @Input() loading = false;
  @Input() errorMessage: string | null = null;
  @Input() activeStatuses: ReadonlyArray<AuditRunStatus> = [...DEFAULT_AUDIT_RUN_FILTER];
  @Input() hasPreviousPage = false;
  @Input() hasNextPage = false;

  @Output() refreshClicked = new EventEmitter<void>();
  @Output() statusToggled = new EventEmitter<AuditRunStatus>();
  @Output() previousPage = new EventEmitter<void>();
  @Output() nextPage = new EventEmitter<void>();
  @Output() runSelected = new EventEmitter<AuditRunRow>();

  readonly statuses = DEFAULT_AUDIT_RUN_FILTER;
  readonly displayedColumns: ReadonlyArray<string> = [
    'status',
    'title',
    'createdAt',
    'durationMs',
    'queuePosition',
    'resultStatus',
  ];
}
