import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { FlowResult } from 'lighthouse';
import { AuditSummary, AuditSummaryComponent } from '../viewer-container/audit-summary.component';
import { ViewerStepDetailComponent } from '../viewer-container/viewer-step-details.component';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatError, MatInput } from '@angular/material/input';
import { RxIf } from '@rx-angular/template/if';
import { MatFabButton } from '@angular/material/button';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { filter, map, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { JsonPipe } from '@angular/common';
import { S3_RESULTS_BUCKET_URL } from '@portal/data-access';

@Component({
  selector: 'viewer-container',
  template: `
    <div *rxIf="results; let r">
      <viewer-audit-summary *rxIf="auditSummary; let summary" [auditSummary]="summary" />
      @for (step of steps(); track step.name) {
        <viewer-step-detail [stepDetails]="step" />
      }
    </div>
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
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class AuditViewerContainer {
  auditId = input<string>();
  readonly #api = inject(HttpClient);

  results = toObservable(this.auditId).pipe(
    filter((audit) => audit !== undefined),
    map((auditKey: string) => `${S3_RESULTS_BUCKET_URL}${auditKey}.uf.json`),
    switchMap((auditKey) => this.#api.get<FlowResult>(auditKey)),
  );

  readonly response = toSignal(this.results);
  steps = computed<FlowResult['steps'] | undefined>(() => {
    const results = this.response();
    if (!results) return;
    return results.steps;
  });

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
