import { Component, computed, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { forkAudit, loadAuditDetails, submitAuditRequest, updateAuditDetails } from './builder.actions';
import { AuditDetails } from '../audit-details';
import { AsyncPipe } from '@angular/common';
import { auditBuilderFeature } from './builder.state';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuditBuilderComponent } from '../components/audit-builder.component';
import { AuditViewerContainer } from '@app-speed/audit/portal/viewer';
import { type StatusDialogModel } from '@app-speed/audit/portal/ui/dialogs';
import {
  MatCard,
  MatCardContent,
  MatCardFooter,
  MatCardHeader,
  MatCardSubtitle,
  MatCardTitle,
} from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

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
        <section data-testid="audit-progress-status">
          <mat-card class="status-card audit-status audit-status--progress">
            <mat-card-header>
              <mat-card-title>{{ status.title || 'loading...' }}</mat-card-title>
              @if (status.subtitle) {
                <mat-card-subtitle>{{ status.subtitle }}</mat-card-subtitle>
              }
            </mat-card-header>
            <mat-card-content [style.padding-top]="'16px'">
              <mat-spinner [diameter]="64" />
            </mat-card-content>
            @if (status.footerText) {
              <mat-card-footer [style.padding]="'0 16px 0 16px'">
                <p>
                  <small>{{ status.footerText }}</small>
                </p>
              </mat-card-footer>
            }
          </mat-card>
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

    .status-card {
      align-items: center;
      text-align: center;
    }

    .audit-status {
      max-width: 960px;
      margin: 16px auto 0;
      padding: 20px;
      border-radius: 16px;
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
  imports: [
    AsyncPipe,
    AuditBuilderComponent,
    AuditViewerContainer,
    MatCard,
    MatCardContent,
    MatCardFooter,
    MatCardHeader,
    MatCardSubtitle,
    MatCardTitle,
    MatProgressSpinner,
  ],
})
export class BuilderComponent implements OnInit {
  private readonly store = inject(Store);
  public readonly auditDetails$ = this.store.select(auditBuilderFeature.selectAudit);
  public readonly modifying$ = this.store.select(auditBuilderFeature.selectModifying);
  public readonly modifying = toSignal(this.modifying$, { initialValue: true });
  private readonly loadingDialog$ = this.store.select(auditBuilderFeature.selectLoadingDialog);
  readonly loadingDialog = toSignal<StatusDialogModel | null>(this.loadingDialog$, { initialValue: null });
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
