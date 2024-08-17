import { Component, inject, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { filter, first, map, Observable, tap, withLatestFrom } from 'rxjs';
import { RxLet } from '@rx-angular/template/let';
import { rxActions } from '@rx-angular/state/actions';
import { RxIf } from '@rx-angular/template/if';
import { RxFor } from '@rx-angular/template/for';
import {
  MatCard,
  MatCardContent,
  MatCardFooter,
  MatCardHeader,
  MatCardSubtitle,
  MatCardTitle,
} from '@angular/material/card';
import { MatAccordion } from '@angular/material/expansion';

import { AuditStepComponent } from './audit-step.component';
import { AuditBuilderService } from './audit-builder.service';
import { AuditGlobalsComponent } from './audit-globals.component';

import { DEFAULT_AUDIT_DETAILS } from '../schema/audit.constants';
import { AuditDetails } from '../schema/types';
import { rxEffects } from '@rx-angular/state/effects';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { SchedulerService } from '@app-speed/data-access';

@Component({
  template: `
    <div class="grid-container" *rxIf="runner.processing; let progress">
      <mat-card class="loading-card">
        <mat-card-header>
          <mat-card-title> Running Analysis </mat-card-title>
          <mat-card-subtitle> progress </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content [style.padding-top]="'16px'">
          <mat-spinner [diameter]="64" />
        </mat-card-content>
      </mat-card>
    </div>

    <form
      *rxIf="auditInit$"
      novalidate
      class="grid-container"
      [formGroup]="builder.formGroup"
      (ngSubmit)="actions.submit($event)"
    >
      <mat-card>
        <mat-card-content>
          <builder-audit-global />
          <mat-accordion [multi]="true">
            <builder-audit-step *rxFor="let control of builder.steps.controls; let idx = index" [stepIndex]="idx" />
          </mat-accordion>
        </mat-card-content>
      </mat-card>
    </form>
  `,
  styleUrl: './audit-builder.styles.scss',
  standalone: true,
  imports: [
    RxLet,
    RxIf,
    RxFor,
    ReactiveFormsModule,
    AuditGlobalsComponent,
    AuditStepComponent,
    AuditGlobalsComponent,
    MatCard,
    MatCardContent,
    MatAccordion,
    MatProgressSpinner,
    MatCardHeader,
    MatCardTitle,
    MatCardFooter,
    MatCardSubtitle,
  ],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class AuditBuilderContainer {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  accordion = viewChild.required(MatAccordion);

  readonly runner = inject(SchedulerService);

  actions = rxActions<{ submit: AuditDetails }>();

  constructor() {
    this.actions.onSubmit(
      (submit$) =>
        submit$.pipe(
          withLatestFrom(this.builder.formGroup.statusChanges, this.builder.formGroup.valueChanges),
          filter(([, formState]) => formState === 'VALID'),
          map(([, , formValue]) => formValue as AuditDetails),
        ),
      this.submitEffect,
    );

    rxEffects(({ register }) => {
      register(this.builder.formGroup.valueChanges, (auditDetails) => this.updateAuditDetails(auditDetails));
    });
  }

  public readonly initialAuditDetails$: Observable<AuditDetails> = this.route.queryParams.pipe(
    map((params) => params['auditDetails']),
    tap((auditDetails) => auditDetails || this.updateAuditDetails(DEFAULT_AUDIT_DETAILS)),
    filter((auditDetail) => !!auditDetail),
    map((auditDetail) => JSON.parse(auditDetail)),
    first(),
    takeUntilDestroyed(),
  );
  builder = inject(AuditBuilderService);
  public readonly auditInit$ = this.builder.auditInit$(this.initialAuditDetails$);

  submitEffect = (event: AuditDetails) => {
    this.builder.formGroup.disable();
    this.accordion().closeAll();
    this.router.navigate([], { relativeTo: this.route });
    this.runner.submitAudit(event);
    // alert(`Submitted Audit: ${JSON.stringify(event)}`);
  };

  updateAuditDetails(auditDetails: object): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { auditDetails: JSON.stringify(auditDetails) },
      queryParamsHandling: 'merge',
    });
  }
}
