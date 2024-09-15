import { Component, inject, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatFabButton } from '@angular/material/button';
import { MatInput } from '@angular/material/input';
import { RxIf } from '@rx-angular/template/if';
import { Router } from '@angular/router';
import { AuditViewerContainer, FlowResultComponent } from '@portal/feature/audit-viewer';
import { toObservable } from '@angular/core/rxjs-interop';
import { FlowResult } from 'lighthouse';
import { filter, map, Observable, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { NgIf } from '@angular/common';
import { S3_RESULTS_BUCKET_URL } from '@portal/data-access';

@Component({
  standalone: true,
  template: `
    <form class="grid-container" [formGroup]="lookupForm" (ngSubmit)="onSubmit()">
      <mat-card>
        <mat-card-content>
          <div class="row">
            <mat-form-field class="full-width">
              <mat-label>Audit ID</mat-label>
              <input matInput placeholder="Audit ID" [formControl]="lookupForm.controls.key" />
              <mat-error *rxIf="!!lookupForm.controls.key.hasError">Title <strong>required</strong></mat-error>
            </mat-form-field>
            <button
              class="submit-btn"
              mat-fab
              [disabled]="lookupForm.disabled"
              [extended]="true"
              color="primary"
              type="submit"
            >
              Analyze
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </form>

    <viewer-flow-result *rxIf="flowResult$; let result" [flowResult]="result" />
  `,
  styles: `
    .grid-container {
      margin: 20px;
    }
    .full-width {
      width: 100%;
    }
    .row {
      display: flex;
      flex-direction: row;
    }
    .submit-btn {
      margin-left: 8px;

      @media only screen and (width >= 600px) {
        margin-left: 16px;
      }
    }
  `,
  imports: [
    ReactiveFormsModule,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatError,
    MatFabButton,
    MatFormField,
    MatInput,
    MatLabel,
    RxIf,
    AuditViewerContainer,
    MatProgressSpinner,
    NgIf,
    FlowResultComponent,
  ],
})
export class ViewerComponent {
  auditId = input<string>('');
  // 2024-08-18T05_160t0WjP64yCyRK0xVadug
  readonly #router = inject(Router);
  readonly #api = inject(HttpClient);

  flowResult$: Observable<FlowResult> = toObservable(this.auditId).pipe(
    filter((audit) => audit !== undefined),
    filter((audit) => audit !== ''),
    map((auditKey: string) => `${S3_RESULTS_BUCKET_URL}${auditKey}.uf.json`),
    switchMap((auditKey) => this.#api.get<FlowResult>(auditKey)),
  );

  public readonly lookupForm = new FormGroup({
    key: new FormControl<string>('2024-08-18T05_160t0WjP64yCyRK0xVadug'),
  });

  onSubmit() {
    this.lookupForm.disable();
    this.#router.navigate([], {
      queryParams: { auditId: this.lookupForm.controls.key.value },
    });
  }
}
