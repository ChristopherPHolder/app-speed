import { Component, computed, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { forkAudit, loadAuditDetails, submitAuditRequest, updateAuditDetails } from './builder.actions';
import { AuditDetails } from '../audit-details';
import { AsyncPipe } from '@angular/common';
import { auditBuilderFeature } from './builder.state';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuditBuilderComponent } from '../components/audit-builder.component';
import { AuditViewerContainer } from '@app-speed/audit/portal/viewer';

@Component({
  selector: 'audit',
  template: `
    @if (auditDetails$ | async; as auditDetails) {
      <ui-audit-builder
        [modifying]="modifying()"
        (modified)="updateAuditDetails($event)"
        [initialAudit]="auditDetails"
        [primaryAction]="primaryAction()"
        [collapseSteps]="collapseSteps()"
        (submitAudit)="submitAudit($event)"
        (forked)="forkCurrentAudit(auditDetails)"
      />

      @if (loadingDialog(); as status) {
        <section class="audit-status audit-status--progress" data-testid="audit-progress-status">
          <h2>{{ status.title }}</h2>
          <p>{{ status.subtitle }}</p>
          @if (status.footerText; as footerText) {
            <small>{{ footerText }}</small>
          }
        </section>
      }

      @if (inlineError(); as errorMessage) {
        <section class="audit-status audit-status--error" data-testid="audit-inline-error">
          <h2>Audit Failed</h2>
          <p>{{ errorMessage }}</p>
        </section>
      }

      @if (showResults()) {
        <section class="audit-results" data-testid="audit-inline-results">
          <viewer-container [auditId]="requestId()!" />
        </section>
      }
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .audit-status,
    .audit-results {
      max-width: 960px;
      margin: 16px auto 0;
      padding: 20px;
      border-radius: 16px;
      background: #fff;
      border: 1px solid #d9e2ec;
      box-shadow: 0 12px 30px rgb(15 23 42 / 0.08);
    }

    .audit-status--progress {
      border-color: #cbd5e1;
    }

    .audit-status--error {
      border-color: #fecaca;
      background: #fff7f7;
    }

    .audit-status h2 {
      margin: 0 0 8px;
      font-size: 1.1rem;
    }

    .audit-status p {
      margin: 0;
      white-space: pre-wrap;
    }

    .audit-status small {
      display: block;
      margin-top: 12px;
      color: #475569;
    }
  `,
  imports: [AsyncPipe, AuditBuilderComponent, AuditViewerContainer],
})
export class BuilderComponent implements OnInit {
  private readonly store = inject(Store);
  public readonly auditDetails$ = this.store.select(auditBuilderFeature.selectAudit);
  public readonly modifying$ = this.store.select(auditBuilderFeature.selectModifying);
  public readonly modifying = toSignal(this.modifying$, { initialValue: true });
  private readonly loadingDialog$ = this.store.select(auditBuilderFeature.selectLoadingDialog);
  readonly loadingDialog = toSignal(this.loadingDialog$, { initialValue: null });
  private readonly auditRequestError$ = this.store.select(auditBuilderFeature.selectAuditRequestError);
  readonly auditRequestError = toSignal(this.auditRequestError$, { initialValue: null });
  private readonly auditResultStatus$ = this.store.select(auditBuilderFeature.selectAuditResultStatus);
  readonly auditResultStatus = toSignal(this.auditResultStatus$, { initialValue: null });
  private readonly auditResultError$ = this.store.select(auditBuilderFeature.selectAuditResultError);
  readonly auditResultError = toSignal(this.auditResultError$, { initialValue: null });
  private readonly requestId$ = this.store.select(auditBuilderFeature.selectRequestId);
  readonly requestId = toSignal(this.requestId$, { initialValue: null });
  readonly showResults = computed(() => this.auditResultStatus() === 'SUCCESS' && this.requestId() !== null);
  readonly primaryAction = computed<'analyze' | 'fork' | 'none'>(() => {
    if (this.modifying()) {
      return 'analyze';
    }

    return this.auditResultStatus() ? 'fork' : 'none';
  });
  readonly collapseSteps = computed(() => this.requestId() !== null);
  readonly inlineError = computed(() => {
    if (this.auditResultStatus() === 'FAILURE') {
      return this.auditResultError() ?? this.auditRequestError() ?? 'Audit failed.';
    }

    if (this.modifying()) {
      return this.auditRequestError();
    }

    return null;
  });

  ngOnInit() {
    this.store.dispatch(loadAuditDetails());
  }

  submitAudit(audit: AuditDetails): void {
    this.store.dispatch(submitAuditRequest({ audit }));
  }

  updateAuditDetails(audit: AuditDetails): void {
    this.store.dispatch(updateAuditDetails({ audit }));
  }

  forkCurrentAudit(audit: AuditDetails): void {
    this.store.dispatch(forkAudit({ audit }));
  }
}
