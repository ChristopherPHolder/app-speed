import { Component } from '@angular/core';
import { JsonPipe } from '@angular/common';
import type { FlowResult } from 'lighthouse';
import { example as RESULTS_MOCK } from '../viewer-container/mocks/flow-result.mock';
import { AuditSummary, AuditSummaryComponent, StepSummary } from '../viewer-container/audit-summary.component';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { ViewerStepStepperComponent } from '../viewer-container/viewer-step-stepper.component';
import { ViewerStepDetailComponent } from '../viewer-container/viewer-step-details.component';

@Component({
  selector: 'viewer-viewer-container',
  template: `
    <viewer-audit-summary [auditSummary]='auditSummary' />
    @for (step of steps; track step.name) {
      <viewer-step-detail [stepDetails]='step'/>
    }
  `,
  standalone: true,
  imports: [
    JsonPipe,
    AuditSummaryComponent,
    MatCard,
    MatCardContent,
    MatCardTitle,
    MatCardHeader,
    ViewerStepStepperComponent,
    ViewerStepDetailComponent,
  ],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class AuditViewerContainer {
  results = RESULTS_MOCK as unknown as FlowResult;

  steps = this.results.steps;

  private readonly stepSummaries: StepSummary[] =  this.results.steps.map((step, index) => {
    return {
      index,
      name: step.name,
      thumbnail: step.lhr.fullPageScreenshot!.screenshot,
      gatherMode: step.lhr.gatherMode,
      categories: step.lhr.categories,
    };
  });
  readonly auditSummary: AuditSummary = {
    stepSummaries: this.stepSummaries,
  }
}
