import { Component, inject, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatFabButton } from '@angular/material/button';
import { MatInput } from '@angular/material/input';
import { RxIf } from '@rx-angular/template/if';
import { Router } from '@angular/router';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { NgIf } from '@angular/common';
import { AuditViewerContainer } from './container/audit-viewer.container';
import { FlowResultComponent } from './flow-result.component';
import { AuditSummaryComponent } from '@app-speed/portal-ui/audit-summary';
import { ViewerStepDetailComponent } from './viewer-container/viewer-step-details.component';

@Component({
  standalone: true,
  template: `
    <form class="grid-container" [formGroup]="lookupForm" (ngSubmit)="onSubmit()">
      <mat-card class="search-bar">
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

    @if (lookupForm.disabled && lookupForm.controls.key.getRawValue(); as auditId) {
      <viewer-container [auditId]="auditId" />
    }
  `,
  styles: `
    .grid-container {
      margin: 20px;
    }
    .search-bar {
      max-width: 1200px;
      margin: auto;
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
    AuditSummaryComponent,
    ViewerStepDetailComponent,
  ],
})
export class ViewerComponent {
  auditId = input<string>('');

  readonly #router = inject(Router);

  // 2024-08-18T05_160t0WjP64yCyRK0xVadug
  public readonly lookupForm = new FormGroup({
    key: new FormControl<string>('2024-10-02T15_12XDZW3hNNpiK3hvyp7FLM'),
  });

  onSubmit() {
    this.lookupForm.disable();
    this.#router.navigate([], {
      queryParams: { auditId: this.lookupForm.controls.key.value },
    });
  }
}
