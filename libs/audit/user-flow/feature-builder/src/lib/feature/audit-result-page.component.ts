import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { catchError, map, of, startWith, switchMap } from 'rxjs';

import { UserFlowAuditPageComponent } from '@app-speed/audit/user-flow/feature-viewer';
import { ApiClient, AuditProgressService } from '@app-speed/audit/user-flow/portal-data-access';

import type { AuditDetails } from '../audit-details';
import { AuditBuilderComponent } from '../components/audit-builder.component';

type AuditLoadState =
  { status: 'loading' } | { status: 'loaded'; audit: AuditDetails } | { status: 'failed'; message: string };

const INITIAL_AUDIT_LOAD_STATE: AuditLoadState = { status: 'loading' };

@Component({
  selector: 'user-flow-audit-result-page',
  imports: [AuditBuilderComponent, UserFlowAuditPageComponent, RouterLink, MatButton, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .audit-navigation {
      box-sizing: border-box;
      max-width: 960px;
      margin: 16px auto 0;
      padding-inline: 20px;
    }

    .audit-navigation a {
      min-height: 48px;
    }
  `,
  template: `
    <nav class="audit-navigation" aria-label="Audit navigation">
      <a matButton="outlined" routerLink="/audits/user-flow/history" queryParamsHandling="preserve">
        <mat-icon aria-hidden="true">arrow_back</mat-icon>
        Audit history
      </a>
    </nav>
    @switch (auditLoadState().status) {
      @case ('loaded') {
        @if (loadedAudit(); as audit) {
          <ui-audit-builder
            [initialAudit]="audit"
            [modifying]="false"
            [primaryAction]="primaryAction()"
            [collapseSteps]="true"
            (forked)="forkAudit(audit)"
          />
        }
      }
      @case ('failed') {
        <section data-testid="audit-inline-error" role="alert">{{ loadError() }}</section>
      }
    }

    @if (loadedAudit()) {
      <user-flow-audit-page [id]="id()" />
    }
  `,
})
export class AuditResultPageComponent {
  readonly id = input.required<string>();
  private readonly api = inject(ApiClient);
  private readonly progress = inject(AuditProgressService);
  private readonly router = inject(Router);

  readonly stage = toSignal(
    toObservable(this.id).pipe(
      switchMap((auditId) => {
        this.progress.watchAudit(auditId);
        return this.progress.stageName$;
      }),
    ),
    { initialValue: 'scheduling' },
  );
  private readonly auditLoadState$ = toObservable(this.id).pipe(
    switchMap((auditId) =>
      this.api.findAudit(auditId).pipe(
        map(({ audit }): AuditLoadState => ({ status: 'loaded', audit })),
        catchError(() =>
          of<AuditLoadState>({
            status: 'failed',
            message: 'Unable to load this audit. It may not exist, or you may not have access.',
          }),
        ),
        startWith(INITIAL_AUDIT_LOAD_STATE),
      ),
    ),
  );
  readonly auditLoadState = toSignal(this.auditLoadState$, { initialValue: INITIAL_AUDIT_LOAD_STATE });
  readonly loadedAudit = computed(() => {
    const state = this.auditLoadState();
    return state.status === 'loaded' ? state.audit : null;
  });
  readonly loadError = computed(() => {
    const state = this.auditLoadState();
    return state.status === 'failed' ? state.message : null;
  });
  readonly primaryAction = computed<'fork' | 'none'>(() =>
    this.stage() === 'done' || this.stage() === 'failed' ? 'fork' : 'none',
  );

  forkAudit(audit: AuditDetails): void {
    void this.router.navigate(['/audits/user-flow'], {
      queryParams: { ['audit-details']: JSON.stringify(audit) },
      queryParamsHandling: 'merge',
    });
  }
}
