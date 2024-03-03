import { Component } from '@angular/core';
import { JsonPipe } from '@angular/common';
import type { FlowResult } from 'lighthouse';
import { example as RESULTS_MOCK } from './mocks/flow-result.mock';
import { AuditSummary, AuditSummaryComponent, StepSummary } from './audit-summary.component';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';


@Component({
  selector: 'lib-viewer-container',
  template: `
      <lib-audit-summary [auditSummary]='auditSummary' />
  `,
  standalone: true,
  imports: [
    JsonPipe,
    AuditSummaryComponent,
    MatCard,
    MatCardContent,
    MatCardTitle,
    MatCardHeader,
  ],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class AuditViewerContainer {
  private results = RESULTS_MOCK as unknown as FlowResult;

  private readonly stepSummaries: StepSummary[] =  this.results.steps.map((step, index) => {
    console.log(step.lhr.categories);
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
