import { Component, computed, effect, inject, input, model } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatFabButton } from '@angular/material/button';
import { MatInput } from '@angular/material/input';
import { RxIf } from '@rx-angular/template/if';
import { Router } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FlowResult } from 'lighthouse';
import { filter, map, Observable, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { NgIf } from '@angular/common';
import { AuditViewerContainer } from './container/audit-viewer.container';
import { FlowResultComponent } from './flow-result.component';
import { AuditSummary, AuditSummaryComponent } from '@app-speed/portal-ui/audit-summary';
import { ViewerStepDetailComponent } from './viewer-container/viewer-step-details.component';

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

    @if (auditSummary(); as summary) {
      <ui-audit-summary [(activeIndex)]="activeIndex" [auditSummary]="summary" />
    }
    @if (auditStep(); as step) {
      <viewer-step-detail [stepDetails]="step" />
    }
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
    AuditSummaryComponent,
    ViewerStepDetailComponent,
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
    map((auditKey: string) => `https://deepblue-userflow-records.s3.eu-central-1.amazonaws.com/${auditKey}.uf.json`),
    switchMap((auditKey) => this.#api.get<FlowResult>(auditKey)),
  );

  auditSummary = toSignal<AuditSummary>(
    this.flowResult$.pipe(
      filter(Boolean),
      map(({ steps }) => {
        return steps.map(({ lhr: { fullPageScreenshot, categories, gatherMode }, name }) => ({
          screenShot: fullPageScreenshot?.screenshot.data || '',
          title: name,
          subTitle: gatherMode,
          categoryScores: Object.values(categories).map(({ title, score }) => ({
            name: title,
            score: parseInt(((score || 0) * 100).toFixed(0), 10),
          })),
        }));
      }),
    ),
  );
  results = toSignal(this.flowResult$.pipe(filter(Boolean)));
  auditStep = computed(() => {
    const results = this.results();
    const activeStep = this.activeIndex();
    if (!results || activeStep === undefined) {
      return;
    }
    return results.steps[activeStep];
  });

  public readonly lookupForm = new FormGroup({
    key: new FormControl<string>('2024-10-02T15_12XDZW3hNNpiK3hvyp7FLM'),
  });

  onSubmit() {
    this.lookupForm.disable();
    this.#router.navigate([], {
      queryParams: { auditId: this.lookupForm.controls.key.value },
    });
  }

  activeIndex = model<number>(0);
  constructor() {
    effect(() => {
      console.log('WOLOLO', this.activeIndex());
    });
  }
}
