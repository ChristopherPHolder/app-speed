import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { loadAuditDetails, submitAuditRequest, updateAuditDetails } from './builder.actions';
import { AuditDetails } from '@app-speed/shared-user-flow-replay';
import { AsyncPipe } from '@angular/common';
import { auditBuilderFeature } from './builder.state';
import { AuditBuilderComponent } from '@app-speed/portal-ui/audit-builder';

@Component({
  selector: 'audit',
  template: `
    @if (auditDetails$ | async; as auditDetails) {
      <ui-audit-builder
        (modified)="updateAuditDetails($event)"
        [initialAudit]="auditDetails"
        (submitAudit)="submitAudit($event)"
      />
    }
  `,
  imports: [AsyncPipe, AuditBuilderComponent],
})
export class BuilderComponent implements OnInit {
  private readonly store = inject(Store);
  public readonly auditDetails$ = this.store.select(auditBuilderFeature.selectAudit);
  public readonly auditBuilderStatus$ = this.store.select(auditBuilderFeature.selectStatus);

  ngOnInit() {
    this.store.dispatch(loadAuditDetails());
  }

  submitAudit(audit: AuditDetails): void {
    this.store.dispatch(submitAuditRequest({ audit }));
  }

  updateAuditDetails(audit: AuditDetails): void {
    this.store.dispatch(updateAuditDetails({ audit }));
  }
}
