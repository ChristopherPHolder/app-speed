import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { FlowResult } from 'lighthouse';
import { example as RESULTS_MOCK } from '../viewer-container/mocks/flow-result.mock';
import { AuditSummary, AuditSummaryComponent } from '../viewer-container/audit-summary.component';
import { ViewerStepDetailComponent } from '../viewer-container/viewer-step-details.component';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatError, MatInput } from '@angular/material/input';
import { RxIf } from '@rx-angular/template/if';
import { MatFabButton } from '@angular/material/button';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { filter, map, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { JsonPipe } from '@angular/common';

@Component({
  template: `
    <form *rxIf="!auditId()">
      <mat-card>
        <mat-card-content class="row">
          <mat-form-field class="full-width">
            <mat-label>Audit ID</mat-label>
            <input matInput placeholder="Audit ID" />
            <mat-error *rxIf="true">Title <strong>required</strong></mat-error>
          </mat-form-field>
          <button class="submit-btn" mat-fab [extended]="true" color="primary" type="submit">Load Audit</button>
        </mat-card-content>
      </mat-card>
    </form>

    <div *rxIf="_results; let r">
      <viewer-audit-summary *rxIf="auditSummary; let summary" [auditSummary]="summary" />
      @for (step of steps(); track step.name) {
        <viewer-step-detail [stepDetails]="step" />
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      max-width: 960px;
      margin: auto;
      --mdc-elevated-card-container-shape: 0;
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
  standalone: true,
  imports: [
    AuditSummaryComponent,
    ViewerStepDetailComponent,
    MatCard,
    MatCardContent,
    MatFormField,
    MatLabel,
    FormsModule,
    MatInput,
    MatError,
    RxIf,
    MatFabButton,
    JsonPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class AuditViewerContainer {
  auditId = input<string>();
  readonly #api = inject(HttpClient);

  _results = toObservable(this.auditId).pipe(
    filter((audit) => audit !== undefined),
    map((auditKey: string) => `https://deepblue-userflow-records.s3.eu-central-1.amazonaws.com/${auditKey}.uf.json`),
    switchMap((auditKey) => this.#api.get<FlowResult>(auditKey)),
  );

  readonly response = toSignal(this._results);
  steps = computed<FlowResult['steps'] | undefined>(() => {
    const results = this.response();
    if (!results) return;
    return results.steps;
  });
  results = RESULTS_MOCK as unknown as FlowResult;

  readonly #stepSummaries = computed(() => {
    const results = this.response();
    if (!results) return;
    return results.steps.map((step, index) => {
      return {
        index,
        name: step.name,
        thumbnail: step.lhr.fullPageScreenshot!.screenshot,
        gatherMode: step.lhr.gatherMode,
        categories: step.lhr.categories,
      };
    });
  });

  readonly auditSummary = computed<AuditSummary | undefined>(() => {
    const stepSummaries = this.#stepSummaries();
    if (!stepSummaries) return;
    return { stepSummaries };
  });
}
