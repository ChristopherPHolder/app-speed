import { AfterViewInit, ChangeDetectionStrategy, Component, inject, OnInit, viewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AuditBuilderComponent } from '@app-speed/portal-ui/audit-builder';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, filter, tap } from 'rxjs';
import { AuditDetails, DEFAULT_AUDIT_DETAILS } from '@app-speed/shared-user-flow-replay';
import { LoadingStatusComponent } from './loading-status.component';
import { RxIf } from '@rx-angular/template/if';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'builder-form',
  template: `
    <ui-audit-builder (submitAudit)="submitAudit()" [initialAudit]="initialAudit" />

    <loading-status *rxIf="submitting" />
  `,
  styleUrl: './audit-builder.styles.scss',
  imports: [ReactiveFormsModule, AuditBuilderComponent, LoadingStatusComponent, RxIf],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class AuditBuilderContainer implements OnInit, AfterViewInit {
  auditForm = viewChild.required(AuditBuilderComponent);
  private modifyingAudit = true;
  protected readonly submitting = new BehaviorSubject<boolean>(false);

  private http = inject(HttpClient);

  submitAudit() {
    this.modifyingAudit = false;
    this.auditForm().formGroup.disable({ onlySelf: true });
    this.auditForm().accordion().closeAll();
    this.submitting.next(true);
    this.http.post('api/conductor/requestAudit', this.auditForm().formGroup.getRawValue()).subscribe((value) => {
      console.log('WOLOLO', value);
    });
  }

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  initialAudit!: AuditDetails;

  ngOnInit() {
    // TODO move logic to router
    this.initialAudit = this.getInitialAuditDetails();
  }

  ngAfterViewInit() {
    this.auditForm()
      .formGroup.valueChanges.pipe(
        filter(() => this.modifyingAudit),
        tap((auditDetails) => {
          return this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { ['audit-details']: JSON.stringify(auditDetails) },
            queryParamsHandling: 'replace',
          });
        }),
      )
      .subscribe();
  }

  private getInitialAuditDetails(): AuditDetails {
    const auditDetailsQuery = this.route.snapshot.queryParams['audit-details'];
    if (auditDetailsQuery) {
      try {
        return JSON.parse(auditDetailsQuery);
      } catch (e) {
        console.error('AuditDetailsQuery', e);
        return DEFAULT_AUDIT_DETAILS;
      }
    }
    return DEFAULT_AUDIT_DETAILS;
  }
}
