import { Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent } from '@angular/material/card';
import { Store } from '@ngrx/store';

import { AuditDetails } from '../audit-details';
import { AuditBuilderComponent } from '../components/audit-builder.component';
import { loadAuditDetails, submitAuditRequest, updateAuditDetails } from './builder.actions';
import { auditBuilderFeature } from './builder.state';

@Component({
  selector: 'audit',
  imports: [AuditBuilderComponent, MatCard, MatCardContent],
  template: `
    @if (auditDetails(); as auditDetails) {
      <ui-audit-builder
        [modifying]="true"
        (modified)="updateAuditDetails($event)"
        [initialAudit]="auditDetails"
        primaryAction="analyze"
        [submittingRequest]="submittingRequest()"
        (submitAudit)="submitAudit($event)"
      />
    }
    @if (auditRequestError(); as errorMessage) {
      <mat-card data-testid="audit-inline-error" role="alert">
        <mat-card-content>{{ errorMessage }}</mat-card-content>
      </mat-card>
    }
  `,
})
export class BuilderComponent implements OnInit {
  private readonly store = inject(Store);
  readonly auditDetails = toSignal(this.store.select(auditBuilderFeature.selectAudit), { initialValue: null });
  readonly submittingRequest = toSignal(this.store.select(auditBuilderFeature.selectSubmittingRequest), {
    initialValue: false,
  });
  readonly auditRequestError = toSignal(this.store.select(auditBuilderFeature.selectAuditRequestError), {
    initialValue: null,
  });

  ngOnInit(): void {
    this.store.dispatch(loadAuditDetails());
  }

  submitAudit(audit: AuditDetails): void {
    if (!this.submittingRequest()) this.store.dispatch(submitAuditRequest({ audit }));
  }

  updateAuditDetails(audit: AuditDetails): void {
    this.store.dispatch(updateAuditDetails({ audit }));
  }
}
