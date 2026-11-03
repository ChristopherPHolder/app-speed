import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import type { ManagementOverviewSchema, OccurrenceHistorySchema } from '@app-speed/audit/user-flow/api-contract';
@Component({
  selector: 'audit-occurrence-history',
  imports: [DatePipe, RouterLink, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './occurrence-history.component.html',
  styleUrl: './occurrence-history.component.scss',
})
export class OccurrenceHistoryComponent {
  readonly entries = input.required<typeof OccurrenceHistorySchema.Type>();
  readonly versions = input.required<typeof ManagementOverviewSchema.Type.versions>();
  protected errorText(error: unknown) {
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      return error.message;
    }
    return JSON.stringify(error);
  }
  protected occurrenceLabel(entry: (typeof OccurrenceHistorySchema.Type)[number]) {
    if (entry.occurrence.outcome === 'overlap') return 'Overlap skipped';
    if (entry.occurrence.outcome === 'missed') return 'Missed during downtime';
    return entry.resultStatus === 'SUCCESS'
      ? 'Successful'
      : entry.resultStatus === 'FAILURE'
        ? 'Failed'
        : (entry.runStatus ?? 'Queued');
  }
  protected occurrenceTone(entry: (typeof OccurrenceHistorySchema.Type)[number]) {
    if (entry.occurrence.outcome !== 'dispatched') return 'skipped';
    return entry.resultStatus === 'SUCCESS' ? 'success' : entry.resultStatus === 'FAILURE' ? 'failure' : 'pending';
  }

  protected versionNumber(versionId: string) {
    const version = this.versions().find((version) => version.id === versionId);
    if (!version) return '—';
    const versions = this.versions().filter((value) => value.templateId === version.templateId);
    return versions.length - versions.findIndex((value) => value.id === versionId);
  }
}
