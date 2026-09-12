import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AuditResultStatus,
  AuditRunStatus,
  AuditRunSummary,
  DEFAULT_AUDIT_RUN_FILTER,
} from '../api/audit-history.models';

@Component({
  selector: 'ui-audit-history-table',
  standalone: true,
  imports: [CommonModule, ClipboardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './audit-history-table.component.html',
  styleUrl: './audit-history-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditHistoryTableComponent {
  @Input({ required: true }) runs: ReadonlyArray<AuditRunSummary> = [];
  @Input() search = '';
  @Input() outcome: AuditResultStatus | null = null;
  @Output() searchChanged = new EventEmitter<string>();
  @Output() outcomeChanged = new EventEmitter<AuditResultStatus | null>();
  @Input() loading = false;
  @Input() errorMessage: string | null = null;
  @Input() activeStatuses: ReadonlyArray<AuditRunStatus> = [...DEFAULT_AUDIT_RUN_FILTER];
  @Input() hasPreviousPage = false;
  @Input() hasNextPage = false;

  @Output() refreshClicked = new EventEmitter<void>();
  @Output() statusToggled = new EventEmitter<AuditRunStatus>();
  @Output() previousPage = new EventEmitter<void>();
  @Output() nextPage = new EventEmitter<void>();
  @Output() runSelected = new EventEmitter<AuditRunSummary>();

  readonly statuses = DEFAULT_AUDIT_RUN_FILTER;
  readonly statusLabels: Record<AuditRunStatus, string> = {
    SCHEDULED: 'Queued',
    IN_PROGRESS: 'Running',
    COMPLETE: 'Completed',
  };
  // Keep the detail cell aligned with the visible columns at the CSS breakpoint.
  readonly compactLayout = toSignal(inject(BreakpointObserver).observe('(max-width: 700px)'));
  readonly expandedId = signal<string | null>(null);
  readonly copyMessage = signal('');
  readonly searchDraft = signal('');

  toggleDetails(id: string) {
    this.expandedId.update((current) => (current === id ? null : id));
  }

  statusLabel(run: AuditRunSummary): string {
    if (run.status !== 'COMPLETE') return this.statusLabels[run.status];
    if (run.resultStatus === 'SUCCESS') return 'Succeeded';
    if (run.resultStatus === 'FAILURE') return 'Failed';
    return 'Completed';
  }

  duration(ms: number | null): string {
    if (ms === null) return '—';
    if (ms < 1000) return ms + ' ms';
    if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
    const seconds = Math.round(ms / 1000);
    return Math.floor(seconds / 60) + 'm ' + (seconds % 60) + 's';
  }
}
