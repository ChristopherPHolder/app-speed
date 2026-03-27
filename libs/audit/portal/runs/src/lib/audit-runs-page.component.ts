import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  AuditRunStatus,
  AuditRunSummary,
  DEFAULT_AUDIT_RUN_FILTER,
} from './data-access/audit-runs.models';
import { AuditRunsApiService } from './data-access/audit-runs-api.service';
import { AuditRunsTableComponent } from './ui/audit-runs-table.component';
import { interval } from 'rxjs';

@Component({
  selector: 'portal-audit-runs-page',
  standalone: true,
  imports: [CommonModule, AuditRunsTableComponent],
  template: `
    <ui-audit-runs-table
      [runs]="runs()"
      [loading]="loading()"
      [errorMessage]="errorMessage()"
      [activeStatuses]="activeStatuses()"
      [hasPreviousPage]="hasPreviousPage()"
      [hasNextPage]="hasNextPage()"
      (refreshClicked)="refresh()"
      (statusToggled)="toggleStatus($event)"
      (previousPage)="goToPreviousPage()"
      (nextPage)="goToNextPage()"
      (runSelected)="openRun($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditRunsPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(AuditRunsApiService);
  private readonly router = inject(Router);

  readonly runs = signal<ReadonlyArray<AuditRunSummary>>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly activeStatuses = signal<ReadonlyArray<AuditRunStatus>>([...DEFAULT_AUDIT_RUN_FILTER]);

  readonly #limit = 25;
  readonly #currentCursor = signal<string | null>(null);
  readonly #nextCursor = signal<string | null>(null);
  readonly #previousCursors = signal<ReadonlyArray<string | null>>([]);

  readonly hasPreviousPage = computed(() => this.#previousCursors().length > 0);
  readonly hasNextPage = computed(() => this.#nextCursor() !== null);

  constructor() {
    this.refresh();
    interval(5000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.#currentCursor() === null) {
          this.refresh();
        }
      });
  }

  refresh() {
    this.loading.set(true);
    this.errorMessage.set(null);

    const selectedStatuses = this.activeStatuses();
    const useStatusFilter =
      selectedStatuses.length === DEFAULT_AUDIT_RUN_FILTER.length ? undefined : selectedStatuses;

    this.api
      .listRuns({
        limit: this.#limit,
        cursor: this.#currentCursor(),
        status: useStatusFilter,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.runs.set(page.items);
          this.#nextCursor.set(page.nextCursor);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.errorMessage.set('Unable to load audit runs. Please try again.');
        },
      });
  }

  toggleStatus(status: AuditRunStatus) {
    const current = this.activeStatuses();
    const hasStatus = current.includes(status);
    const nextStatuses = hasStatus ? current.filter((item) => item !== status) : [...current, status];

    // Keep at least one active status filter.
    if (nextStatuses.length === 0) {
      return;
    }

    const orderedStatuses = DEFAULT_AUDIT_RUN_FILTER.filter((item) => nextStatuses.includes(item));
    this.activeStatuses.set(orderedStatuses);
    this.#currentCursor.set(null);
    this.#nextCursor.set(null);
    this.#previousCursors.set([]);
    this.refresh();
  }

  goToNextPage() {
    const next = this.#nextCursor();
    if (!next) {
      return;
    }

    this.#previousCursors.update((history) => [...history, this.#currentCursor()]);
    this.#currentCursor.set(next);
    this.refresh();
  }

  goToPreviousPage() {
    const history = this.#previousCursors();
    if (history.length === 0) {
      return;
    }

    const previousCursor = history[history.length - 1] ?? null;
    this.#previousCursors.set(history.slice(0, -1));
    this.#currentCursor.set(previousCursor);
    this.refresh();
  }

  openRun(run: AuditRunSummary) {
    if (run.status === 'COMPLETE') {
      this.router.navigate(['/user-flow/viewer'], { queryParams: { auditId: run.auditId } });
      return;
    }

    this.router.navigate(['/audit-runs', run.auditId]);
  }
}
