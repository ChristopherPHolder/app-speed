import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuditBuilderComponent } from 'ui/audit-builder';
import { ActivatedRoute, Router } from '@angular/router';
import { RxPush } from '@rx-angular/template/push';
import { RxIf } from '@rx-angular/template/if';

type DeviceOption = 'mobile' | 'tablet' | 'desktop';

interface AuditDetails  {
  title: string;
  device: DeviceOption;
  timeout: number
  steps: any[]
}

const DEFAULT_AUDIT_DETAILS: AuditDetails = {
  title: '',
  device: 'mobile',
  timeout: 30000,
  steps: [
    { type: 'startNavigation', stepOptions: { name: 'Initial Navigation' } },
    { type:  'navigate', url: 'https://google.com' },
    { type: 'endNavigation' },
  ]
};

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
