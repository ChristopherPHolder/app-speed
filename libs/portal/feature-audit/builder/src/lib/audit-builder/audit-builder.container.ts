import { AfterViewInit, ChangeDetectionStrategy, Component, inject, OnInit, viewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AuditBuilderComponent } from '@app-speed/portal-ui/audit-builder';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, distinctUntilChanged, filter, tap } from 'rxjs';
import { AuditDetails, DEFAULT_AUDIT_DETAILS } from '@app-speed/shared-user-flow-replay';
import { LoadingStatusComponent } from './loading-status.component';
import { RxIf } from '@rx-angular/template/if';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from './error-dialog.component';
import { ApiService } from '@app-speed/portal-data-access';
import { eventValue, rxActions } from '@rx-angular/state/actions';
import { rxState } from '@rx-angular/state';
import { rxEffects } from '@rx-angular/state/effects';
import { isEqual } from 'lodash-es';

@Component({
  selector: 'builder-form',
  template: `
    <ui-audit-builder (submitAudit)="actions.submit($event)" [initialAudit]="initialAudit" />

    <loading-status *rxIf="state.select('submittingRequest')" />
  `,
  styleUrl: './audit-builder.styles.scss',
  imports: [ReactiveFormsModule, AuditBuilderComponent, LoadingStatusComponent, RxIf],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class AuditBuilderContainer implements OnInit, AfterViewInit {
  readonly state = rxState<{
    submittingRequest: boolean;
    auditDetails: AuditDetails | undefined;
  }>();

  readonly actions = rxActions<{ submit: AuditDetails }>(({ transforms }) => transforms({ submit: eventValue }));

  constructor() {
    this.actions.onSubmit(
      (y) => y.pipe(distinctUntilChanged(isEqual)),
      (auditDetails: AuditDetails) =>
        this.state.set({
          submittingRequest: true,
          auditDetails: auditDetails,
        }),
    );

    rxEffects(({ register }) => {
      register(this.state.select('auditDetails').pipe(filter(Boolean)), (auditDetails: AuditDetails) => {
        this.api.requestAudit(auditDetails).subscribe((value: any) => {
          const dialog = this.dialogRef.open(ErrorDialogComponent, {
            data: { title: 'Parser Error', message: value.message['errorMessage'] },
            role: 'alertdialog',
            maxWidth: '90vw',
            maxHeight: '90vh',
          });
          dialog.afterClosed().subscribe(() => {
            this.auditForm().formGroup.enable();
            this.submitting.next(false);
            this.auditForm().accordion().openAll();
          });
        });
      });
    });

    rxEffects(({ register }) => {
      register(this.state.select('submittingRequest'), (isSubmitting: boolean) => {
        if (isSubmitting) {
          this.auditForm().formGroup.disable();
          this.auditForm().accordion().closeAll();
        } else {
          this.auditForm().formGroup.enable();
          this.auditForm().accordion().openAll();
        }
      });
    });
  }

  readonly dialogRef = inject(MatDialog);

  auditForm = viewChild.required(AuditBuilderComponent);
  private modifyingAudit = true;
  protected readonly submitting = new BehaviorSubject<boolean>(false);

  private readonly api = inject(ApiService);

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
