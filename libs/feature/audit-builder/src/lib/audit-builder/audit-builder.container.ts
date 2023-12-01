import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { RxPush } from '@rx-angular/template/push';
import { RxIf } from '@rx-angular/template/if';

import { AuditBuilderComponent } from 'ui/audit-builder';

import { AuditDetails } from './audit-builder.types';
import { DEFAULT_AUDIT_DETAILS } from './audit-builder.constants';

@Component({
  standalone: true,
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'audit-builder-container',
  template: `
    <ui-audit-builder
      *rxIf='auditDetails'
      [auditDetails]='auditDetails'
      (auditSubmit)='submitted($event)'
      (auditDetailsChange)='updateAuditDetails($event)'
    />`,
  imports: [
    RxPush,
    RxIf,
    AuditBuilderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// TODO Change linter to only accept container suffix
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class AuditBuilderContainer {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private auditDetailsQueryParam = this.route.snapshot.queryParams['auditDetails'];
  public auditDetails = this.auditDetailsQueryParam ? JSON.parse(this.auditDetailsQueryParam) : this.setDefaultAuditDetails();

  private setDefaultAuditDetails(): AuditDetails {
    this.updateAuditDetails(DEFAULT_AUDIT_DETAILS);
    return DEFAULT_AUDIT_DETAILS;
  }

  submitted(event: any) {
    alert(`${JSON.stringify(event, null, 2)}`)
  }

  updateAuditDetails(auditDetails: object): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { auditDetails: JSON.stringify(auditDetails) },
      queryParamsHandling: 'merge'
    })
  };
}
