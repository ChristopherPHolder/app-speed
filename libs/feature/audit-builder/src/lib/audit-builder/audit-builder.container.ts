import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { filter, first, map, tap } from 'rxjs';

import { RxLet } from '@rx-angular/template/let';

import { AuditBuilderComponent } from 'ui/audit-builder';

import { DEFAULT_AUDIT_DETAILS } from './audit-builder.constants';

@Component({
  standalone: true,
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'audit-builder-container',
  template: `
    <ui-audit-builder
      *rxLet='initialAuditDetails$; let details'
      [auditDetails]='details'
      (auditSubmit)='submitted($event)'
      (auditDetailsChange)='updateAuditDetails($event)'
    />`,
  imports: [
    AuditBuilderComponent,
    RxLet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class AuditBuilderContainer {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  public readonly initialAuditDetails$ = this.route.queryParams.pipe(
    map((params) => params['auditDetails']),
    tap((auditDetails) => auditDetails || this.updateAuditDetails(DEFAULT_AUDIT_DETAILS)),
    filter((auditDetail) => !!auditDetail),
    map((auditDetail) => JSON.parse(auditDetail)),
    first(),
    takeUntilDestroyed()
  )

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
