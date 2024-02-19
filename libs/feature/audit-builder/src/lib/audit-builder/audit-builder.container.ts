import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { filter, first, map, Observable, tap } from 'rxjs';

import { RxLet } from '@rx-angular/template/let';

import { DEFAULT_AUDIT_DETAILS } from '../schema/audit.constants';
import { AuditBuilderService } from './audit-builder.service';
import { AuditDetails } from '../schema/audit-builder.types';
import { RxIf } from '@rx-angular/template/if';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { AuditStepComponent } from './audit-step.component';
import { RxFor } from '@rx-angular/template/for';
import { AuditGlobalsComponent } from './audit-globals.component';

@Component({
  standalone: true,
  selector: 'lib-builder-container',
  template: `
    <form *rxIf='auditInit$' novalidate class='grid-container' [formGroup]='builder.formGroup'>
      <mat-card>
        <mat-card-content>
          <lib-audit-global />
          <mat-accordion [multi]='true'>
            <lib-audit-step *rxFor='let control of builder.steps.controls; let index = index;' [stepIndex]='index' />
          </mat-accordion>
        </mat-card-content>
      </mat-card>
    </form>
  `,
  styleUrls: ['./audit-builder.styles.scss'],
  imports: [
    RxLet,
    RxIf,
    ReactiveFormsModule,
    MatCardModule,
    AuditGlobalsComponent,
    MatExpansionModule,
    AuditStepComponent,
    RxFor,
    AuditGlobalsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class AuditBuilderContainer {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

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
