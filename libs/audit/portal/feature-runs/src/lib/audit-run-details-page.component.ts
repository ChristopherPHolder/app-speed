import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AuditRunSummary, AuditRunsApiService } from '@app-speed/audit/portal-data-access-runs';
import { AuditRunDetailsComponent } from '@app-speed/audit/portal-ui-runs';
import { catchError, interval, of, switchMap } from 'rxjs';

@Component({
  selector: 'portal-audit-run-details-page',
  standalone: true,
  imports: [AuditRunDetailsComponent],
  template: `
    <ui-audit-run-details
      [run]="run()"
      [loading]="loading()"
      [errorMessage]="errorMessage()"
      (backClicked)="backToRuns()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditRunDetailsPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(AuditRunsApiService);
  private readonly router = inject(Router);

  readonly run = signal<AuditRunSummary | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  #hasRedirected = false;

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const auditId = params.get('id');
          if (!auditId) {
            this.loading.set(false);
            this.errorMessage.set('Run id is missing from the route.');
            return of(null);
          }

          return interval(5000).pipe(
            switchMap(() =>
              this.api.getRun(auditId).pipe(
                catchError((error) => {
                  this.errorMessage.set(error?.error?.message ?? 'Unable to load run details.');
                  this.loading.set(false);
                  return of(null);
                }),
              ),
            ),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((run) => {
        if (!run) {
          return;
        }

        this.loading.set(false);
        this.errorMessage.set(null);
        this.run.set(run);

        if (!this.#hasRedirected && run.status === 'COMPLETE' && run.resultStatus !== null) {
          this.#hasRedirected = true;
          this.router.navigate(['/user-flow/viewer'], { queryParams: { auditId: run.auditId } });
        }
      });

    // Trigger immediate first load.
    this.api
      .getRun(this.route.snapshot.paramMap.get('id') ?? '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (run) => {
          if (!run) {
            return;
          }
          this.loading.set(false);
          this.run.set(run);
        },
        error: () => {
          this.loading.set(false);
          this.errorMessage.set('Unable to load run details.');
        },
      });
  }

  backToRuns() {
    this.router.navigate(['/audit-runs']);
  }
}
