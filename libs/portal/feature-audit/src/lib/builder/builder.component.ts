import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { loadAuditDetails, submitAuditRequest, updateAuditDetails } from './builder.actions';
import { AuditDetails } from '@app-speed/shared-user-flow-replay';
import { AsyncPipe } from '@angular/common';
import { auditBuilderFeature } from './builder.state';
import { AuditBuilderComponent } from '@app-speed/portal-ui/audit-builder';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ErrorDialogComponent } from 'libs/portal/feature-audit/builder/src/lib/audit-builder/error-dialog.component';
import { LoadingStatusComponent } from 'libs/portal/feature-audit/builder/src/lib/audit-builder/loading-status.component';
import { filter, scan, tap } from 'rxjs';

@Component({
  selector: 'audit',
  template: `
    @if (auditDetails$ | async; as auditDetails) {
      <ui-audit-builder
        [modifing]="modifying()"
        (modified)="updateAuditDetails($event)"
        [initialAudit]="auditDetails"
        (submitAudit)="submitAudit($event)"
      />
    }
  `,
  imports: [AsyncPipe, AuditBuilderComponent],
})
export class BuilderComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly store = inject(Store);
  public readonly auditDetails$ = this.store.select(auditBuilderFeature.selectAudit);
  public readonly auditBuilderStatus$ = this.store.select(auditBuilderFeature.selectStatus);
  public readonly modifying$ = this.store.select(auditBuilderFeature.selectModifying);
  public readonly modifying = toSignal(this.modifying$, { initialValue: true });


  private readonly auditRequestError$ = this.store.select(auditBuilderFeature.selectAuditRequestError);
  private readonly dialog = inject(MatDialog);
  auditSubmittingRequest$ = this.store.select(auditBuilderFeature.selectSubmittingRequest);

  ngOnInit() {
    this.store.dispatch(loadAuditDetails());
    this.auditDetails$.subscribe(console.log);

    this.auditSubmittingRequest$.pipe(
      takeUntilDestroyed(this.destroyRef),
      scan((acc, loading) => {
        console.log('auditSubmittingRequest', loading);
        if (acc.dialog && !loading) {
          acc.dialog.close();
          return { loading: false, dialog: null };
        } else if (acc.dialog && loading) {
          return acc;
        }
        if (loading) {
          return { loading: true, dialog: this.dialog.open(LoadingStatusComponent, {
            data: {
              title: 'Submitting Audit',
            },
            disableClose: true,
          }) };
        }
        return acc;
      }, { loading: false, dialog: null } as { loading: boolean; dialog: MatDialogRef<LoadingStatusComponent, any> | null }),
    ).subscribe();

    this.auditRequestError$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((error) => {
      if (error) {
        this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'Request Failed',  
            message: error,
          },
      });
      }
    });
  }


  submitAudit(audit: AuditDetails): void {
    this.store.dispatch(submitAuditRequest({ audit }));
  }

  updateAuditDetails(audit: AuditDetails): void {
    this.store.dispatch(updateAuditDetails({ audit }));
  }
}
