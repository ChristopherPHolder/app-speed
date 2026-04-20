import { Component, DestroyRef, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { Store } from '@ngrx/store';
import { loadAuditDetails, submitAuditRequest, updateAuditDetails } from './builder.actions';
import { AuditDetails } from '@app-speed/audit/portal/model';
import { AsyncPipe } from '@angular/common';
import { auditBuilderFeature } from './builder.state';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  ErrorDialog,
  StatusDialog,
  type ErrorDialogModel,
  type StatusDialogModel,
} from '@app-speed/audit/portal/ui/dialogs';
import { scan } from 'rxjs';
import { AuditBuilderComponent } from '../components/audit-builder.component';

@Component({
  selector: 'audit',
  template: `
    @if (auditDetails$ | async; as auditDetails) {
      <ui-audit-builder
        [modifying]="modifying()"
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
  public readonly modifying$ = this.store.select(auditBuilderFeature.selectModifying);
  public readonly modifying = toSignal(this.modifying$, { initialValue: true });
  private readonly auditLoadingDialog$ = this.store.select(auditBuilderFeature.selectLoadingDialog);

  private readonly auditRequestError$ = this.store.select(auditBuilderFeature.selectAuditRequestError);
  private readonly dialog = inject(MatDialog);

  ngOnInit() {
    this.store.dispatch(loadAuditDetails());
    this.auditDetails$.subscribe(console.log);

    this.auditLoadingDialog$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        scan(
          (acc, loadingDialog) => {
            if (acc.dialog && !loadingDialog) {
              acc.dialog.close();
              return { loading: null, dialog: null };
            } else if (acc.dialog && acc.loading && loadingDialog) {
              acc.loading.set(loadingDialog);
              return acc;
            }
            if (loadingDialog) {
              const loadingData = signal(loadingDialog);
              return {
                loading: loadingData,
                dialog: this.dialog.open(StatusDialog, {
                  data: loadingData,
                  disableClose: true,
                }),
              };
            }
            return acc;
          },
          { loading: null, dialog: null } as {
            loading: WritableSignal<StatusDialogModel> | null;
            dialog: MatDialogRef<StatusDialog, unknown> | null;
          },
        ),
      )
      .subscribe();

    this.auditRequestError$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((error) => {
      if (error) {
        const dialogData: ErrorDialogModel = {
          title: 'Request Failed',
          message: error,
        };

        this.dialog.open(ErrorDialog, {
          data: dialogData,
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
