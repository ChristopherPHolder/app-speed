import { Component, inject } from '@angular/core';
import { AuditBuilderComponent } from '../../audit-builder/audit-builder.component';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, map, Observable } from 'rxjs';
import { RxPush } from '@rx-angular/template/push';
import { tap } from 'rxjs/operators';
import { RxIf } from '@rx-angular/template/if';

type DeviceOption = 'mobile' | 'tablet' | 'desktop';

interface AuditDetails  {
  title: string;
  device: DeviceOption;
  timeout: number
  steps: []
};

@Component({
  standalone: true,
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'audit-builder-container',
  template: `
    <lib-audit-builder 
      *rxIf='auditDetails$; let auditDetails' 
      [auditDetails]='auditDetails'  
      (auditSubmit)='submited($event)'
      (auditInputChange)='updateAuditDetails($event)'
    />`,
  imports: [
    AuditBuilderComponent,
    RxPush,
    RxIf,
  ],
})
// TODO Change linter to only accept container suffix
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class AuditBuilderContainer {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  public readonly auditDetails$: Observable<AuditDetails> = this.route.queryParamMap.pipe(
    map(params => params.get('auditDetails')),
    tap(auditDetails => auditDetails || this.updateAuditDetails(this.defaultAudit)),
    filter(Boolean),
    map(auditDetails => JSON.parse(auditDetails)),
  )

  submited(event: any) {
    alert(`WOLOLO\n${event}`)
  }

  updateAuditDetails(auditDetails: object) {
    const auditDetailsString = JSON.stringify(auditDetails);
    console.log(auditDetailsString);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { auditDetails: auditDetailsString },
      queryParamsHandling: 'merge'
    })
  };

  private readonly defaultAudit = {
    title: '',
    device: 'mobile',
    timeout: '30000',
    steps: [
      { type: 'startNavigation', stepOptions: { name: 'Initial Navigation' } },
      { type:  'navigate', url: 'https://google.com' },
      { type: 'endNavigation' },
    ]
  };
}
