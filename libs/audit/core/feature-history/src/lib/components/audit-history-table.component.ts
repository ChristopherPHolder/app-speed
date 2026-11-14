import { ClipboardModule } from '@angular/cdk/clipboard';
import { DatePipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatChipListbox, MatChipOption, type MatChipSelectionChange } from '@angular/material/chips';
import { MatFormField, MatLabel, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { EmptyStateComponent } from '@app-speed/ui/empty-state';
import { MessageActionsDirective, MessageComponent } from '@app-speed/ui/message';
import { PageComponent } from '@app-speed/ui/page';
import { PageHeaderActionsDirective, PageHeaderComponent } from '@app-speed/ui/page-header';
import { StatusChipComponent, type StatusTone } from '@app-speed/ui/status-chip';
import {
  AuditResultStatus,
  AuditRunStatus,
  AuditRunSummary,
  DEFAULT_AUDIT_RUN_FILTER,
} from '../api/audit-history.models';

@Component({
  selector: 'ui-audit-history-table',
  standalone: true,
  imports: [
    ClipboardModule,
    DatePipe,
    SlicePipe,
    MatButton,
    MatIconButton,
    MatChipListbox,
    MatChipOption,
    MatFormField,
    MatLabel,
    MatPrefix,
    MatSuffix,
    MatIcon,
    MatInput,
    MatProgressBar,
    MatTooltip,
    EmptyStateComponent,
    MessageActionsDirective,
    MessageComponent,
    PageComponent,
    PageHeaderActionsDirective,
    PageHeaderComponent,
    StatusChipComponent,
  ],
  templateUrl: './audit-history-table.component.html',
  styles: `
    :host {
      display: block;
    }
    .panel {
      overflow: hidden;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-surface-container-lowest);
    }
    .filters {
      display: flex;
      flex-wrap: wrap;
      padding: var(--ui-space-4);
      align-items: center;
      gap: var(--ui-space-3) var(--ui-space-6);
    }
    .search {
      flex: 1 1 280px;
    }
    .search mat-form-field {
      width: 100%;
    }
    .progress {
      height: var(--ui-space-1);
    }
    .error {
      margin: 0 var(--ui-space-4) var(--ui-space-4);
    }
    .table-container {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: start;
    }
    th {
      padding: var(--ui-space-3) var(--ui-space-4);
      border-block: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-low);
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-large);
      text-align: start;
      white-space: nowrap;
    }
    td {
      padding: var(--ui-space-3) var(--ui-space-4);
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      color: var(--mat-sys-on-surface);
      font: var(--mat-sys-body-medium);
      vertical-align: middle;
    }
    .audit-row:hover,
    .audit-row.expanded {
      background: color-mix(
        in srgb,
        var(--mat-sys-on-surface) calc(var(--mat-sys-hover-state-layer-opacity) * 100%),
        transparent
      );
    }
    .audit-row.expanded td {
      border-bottom-color: transparent;
    }
    .audit-cell {
      min-width: 200px;
    }
    .audit-title {
      display: block;
      padding: var(--ui-space-1) 0;
      border: 0;
      border-radius: var(--mat-sys-corner-extra-small);
      background: none;
      color: var(--mat-sys-on-surface);
      font: var(--mat-sys-title-small);
      text-align: start;
      cursor: pointer;
      overflow-wrap: anywhere;
    }
    .audit-title:hover {
      color: var(--mat-sys-primary);
      text-decoration: underline;
      text-underline-offset: 3px;
    }
    .metadata,
    .queue,
    .time,
    .pagination,
    dt {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
    .metadata {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ui-space-1) var(--ui-space-2);
    }
    .copy-id {
      display: inline-flex;
      min-height: var(--ui-space-6);
      padding: 0 var(--ui-space-1);
      border: 0;
      border-radius: var(--mat-sys-corner-extra-small);
      background: none;
      color: inherit;
      font: inherit;
      font-family: ui-monospace, 'SF Mono', Menlo, monospace;
      cursor: pointer;
      align-items: center;
      gap: var(--ui-space-1);
    }
    .copy-id:hover {
      color: var(--mat-sys-primary);
    }
    .copy-id mat-icon {
      width: 14px;
      height: 14px;
      font-size: 14px;
    }
    .queue,
    .time {
      display: block;
      margin-top: var(--ui-space-1);
    }
    .created,
    .duration {
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .duration {
      text-align: end;
    }
    .actions {
      width: 96px;
      text-align: end;
      white-space: nowrap;
    }
    .details-toggle mat-icon {
      transition: transform var(--ui-motion-duration-short4) var(--ui-motion-easing-standard);
    }
    .details-toggle[aria-expanded='true'] mat-icon {
      transform: rotate(180deg);
    }
    .detail-row td {
      background: var(--mat-sys-surface-container-low);
    }
    .detail-content {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--ui-space-4) var(--ui-space-6);
    }
    dl {
      display: grid;
      flex: 1 1 420px;
      margin: 0;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: var(--ui-space-4) var(--ui-space-6);
    }
    .full-id {
      grid-column: 1 / -1;
    }
    dd {
      margin: var(--ui-space-1) 0 0;
      overflow-wrap: anywhere;
    }
    .full-id dd {
      font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    }
    .pagination {
      display: flex;
      flex-wrap: wrap;
      padding: var(--ui-space-2) var(--ui-space-2) var(--ui-space-2) var(--ui-space-4);
      align-items: center;
      justify-content: space-between;
      gap: var(--ui-space-2);
    }
    .pagination-actions {
      display: flex;
      margin-inline-start: auto;
    }
    @media (width < 600px) {
      /* Each run becomes a stacked item; the table roles keep it a table for assistive technology. */
      table,
      tbody,
      tr,
      td {
        display: block;
      }
      thead {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
      }
      .audit-row {
        display: flex;
        flex-wrap: wrap;
        padding: var(--ui-space-3) var(--ui-space-2) var(--ui-space-3) var(--ui-space-4);
        border-bottom: 1px solid var(--mat-sys-outline-variant);
        align-items: center;
        gap: var(--ui-space-2) var(--ui-space-3);
      }
      .audit-row.expanded {
        border-bottom-color: transparent;
      }
      .audit-row td {
        padding: 0;
        border: 0;
      }
      /* The title shares the first line with the actions; status, date and duration wrap below. */
      .audit-cell {
        flex: 1 1 calc(100% - 108px);
        min-width: 0;
      }
      .actions {
        flex: none;
        width: auto;
        order: 1;
      }
      .status-cell,
      .created,
      .duration {
        order: 2;
      }
      .status-cell {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--ui-space-2);
      }
      .queue {
        margin: 0;
      }
      .duration {
        margin-inline-start: auto;
        padding-inline-end: var(--ui-space-2);
      }
      .time {
        display: inline;
        margin: 0 0 0 var(--ui-space-1);
      }
      .detail-row[hidden] {
        display: none;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .details-toggle mat-icon {
        transition: none;
      }
    }
  `,
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
  readonly outcomes: ReadonlyArray<{ label: string; value: AuditResultStatus | null }> = [
    { label: 'All outcomes', value: null },
    { label: 'Succeeded', value: 'SUCCESS' },
    { label: 'Failed', value: 'FAILURE' },
  ];
  readonly expandedId = signal<string | null>(null);
  readonly copyMessage = signal('');
  readonly searchDraft = signal('');

  toggleDetails(id: string) {
    this.expandedId.update((current) => (current === id ? null : id));
  }

  /** One outcome is always selected, so pressing the selected chip leaves it selected. */
  selectOutcome(outcome: AuditResultStatus | null, change: MatChipSelectionChange) {
    if (!change.isUserInput) return;
    if (change.selected) this.outcomeChanged.emit(outcome);
    else change.source.select();
  }

  /** At least one status stays selected, so the last one can't be turned off. */
  toggleStatus(status: AuditRunStatus, change: MatChipSelectionChange) {
    if (!change.isUserInput) return;
    if (!change.selected && this.activeStatuses.length === 1) change.source.select();
    else this.statusToggled.emit(status);
  }

  statusLabel(run: AuditRunSummary): string {
    if (run.status !== 'COMPLETE') return this.statusLabels[run.status];
    if (run.resultStatus === 'SUCCESS') return 'Succeeded';
    if (run.resultStatus === 'FAILURE') return 'Failed';
    return 'Completed';
  }

  statusTone(run: AuditRunSummary): StatusTone {
    if (run.status === 'IN_PROGRESS') return 'info';
    if (run.status !== 'COMPLETE') return 'neutral';
    if (run.resultStatus === 'SUCCESS') return 'success';
    if (run.resultStatus === 'FAILURE') return 'error';
    return 'neutral';
  }

  statusIcon(run: AuditRunSummary): string {
    if (run.status === 'SCHEDULED') return 'schedule';
    if (run.resultStatus === 'SUCCESS') return 'check';
    if (run.resultStatus === 'FAILURE') return 'close';
    return 'done';
  }

  duration(ms: number | null): string {
    if (ms === null) return '—';
    if (ms < 1000) return ms + ' ms';
    if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
    const seconds = Math.round(ms / 1000);
    return Math.floor(seconds / 60) + 'm ' + (seconds % 60) + 's';
  }
}
