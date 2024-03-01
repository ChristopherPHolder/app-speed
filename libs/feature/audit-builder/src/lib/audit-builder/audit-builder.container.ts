import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { filter, first, map, Observable, OperatorFunction, tap, withLatestFrom } from 'rxjs';

import { RxLet } from '@rx-angular/template/let';

import { DEFAULT_AUDIT_DETAILS } from '../schema/audit.constants';
import { AuditBuilderService } from './audit-builder.service';
import { rxActions } from '@rx-angular/state/actions';
import { RxIf } from '@rx-angular/template/if';
import { RxFor } from '@rx-angular/template/for';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { AuditStepComponent } from './audit-step.component';
import { AuditGlobalsComponent } from './audit-globals.component';

import { AuditDetails } from '../schema/types';

@Component({
  standalone: true,
  selector: 'lib-builder-container',
  template: `
    <form 
      *rxIf='auditInit$' 
      novalidate 
      class='grid-container'
      [formGroup]='builder.formGroup'
      (ngSubmit)='actions.submit($event)'
    >
      <mat-card>
        <mat-card-content>
          <lib-audit-global />
          <mat-accordion [multi]='true'>
            <lib-audit-step *rxFor='let control of builder.steps.controls; let idx = index;' [stepIndex]='idx' />
          </mat-accordion>
        </mat-card-content>
      </mat-card>
    </form>
  `,
  styleUrls: ['./audit-builder.styles.scss'],
  imports: [
    RxLet,
    RxIf,
    RxFor,
    ReactiveFormsModule,
    MatCardModule,
    AuditGlobalsComponent,
    MatExpansionModule,
    AuditStepComponent,
    AuditGlobalsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class AuditBuilderContainer {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  actions = rxActions<{ submit: AuditDetails, change: AuditDetails }>();

  constructor() {
    this.actions.onSubmit(this.submitMapper, this.submitEffect);
  }

  public readonly initialAuditDetails$: Observable<AuditDetails> = this.route.queryParams.pipe(
    map((params) => params['auditDetails']),
    tap((auditDetails) => auditDetails || this.updateAuditDetails(DEFAULT_AUDIT_DETAILS)),
    filter((auditDetail) => !!auditDetail),
    map((auditDetail) => JSON.parse(auditDetail)),
    first(),
    takeUntilDestroyed()
  )
  builder = inject(AuditBuilderService);
  public readonly auditInit$ = this.builder.auditInit$(this.initialAuditDetails$)

  submitEffect = (event: AuditDetails) => {
    alert(`${JSON.stringify(event, null, 2)}`);
  };

  submitMapper: OperatorFunction<AuditDetails, AuditDetails> = (auditDetails$) => auditDetails$.pipe(
    withLatestFrom(this.builder.formGroup.statusChanges, this.builder.formGroup.valueChanges),
    filter(([,formState,]) => formState === 'VALID'),
    map(([,, formValue]) => formValue as AuditDetails)
  );

  updateAuditDetails(auditDetails: object): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { auditDetails: JSON.stringify(auditDetails) },
      queryParamsHandling: 'merge'
    })
  }
}
