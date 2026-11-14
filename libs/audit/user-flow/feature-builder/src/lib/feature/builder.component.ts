import { Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageHeaderComponent } from '@app-speed/ui/page-header';
import { Store } from '@ngrx/store';

import { AuditDetails } from '../audit-details';
import { AuditBuilderComponent } from '../components/audit-builder.component';
import { loadAuditDetails, submitAuditRequest, updateAuditDetails } from './builder.actions';
import { auditBuilderFeature } from './builder.state';

@Component({
  selector: 'audit',
  imports: [AuditBuilderComponent, PageHeaderComponent],
  template: `
    <div class="audit-header">
      <ui-page-header
        heading="Run an audit"
        description="Describe a user journey as a sequence of browser steps, then run it."
      />
    </div>
    @if (auditDetails(); as auditDetails) {
      <ui-audit-builder
        [modifying]="true"
        (modified)="updateAuditDetails($event)"
        [initialAudit]="auditDetails"
        primaryAction="analyze"
        [submittingRequest]="submittingRequest()"
        [errorMessage]="auditRequestError()"
        (submitAudit)="submitAudit($event)"
      />
    }
  `,
  styles: `
    .audit-header {
      box-sizing: border-box;
      max-width: calc(var(--ui-page-width-medium) + 2 * var(--ui-page-gutter));
      margin: 0 auto;
      padding: var(--ui-space-6) var(--ui-page-gutter) 0;
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
