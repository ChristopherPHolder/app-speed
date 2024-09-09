import { Component, computed, input } from '@angular/core';
import { FlowResult } from 'lighthouse';
import { ViewerStepDetailComponent } from './viewer-container/viewer-step-details.component';
import { AuditSummary, AuditSummaryComponent } from './viewer-container/audit-summary.component';
import { RxIf } from '@rx-angular/template/if';

@Component({
  selector: 'viewer-flow-result',
  standalone: true,
  template: `
    <viewer-audit-summary [auditSummary]="auditSummary()" />
    @for (step of steps(); track step.name) {
      <viewer-step-detail [stepDetails]="step" />
    }
  `,
  styles: ``,
  imports: [ViewerStepDetailComponent, AuditSummaryComponent, RxIf],
})
export class FlowResultComponent {
  flowResult = input.required<FlowResult>();
  steps = computed<FlowResult['steps']>(() => this.flowResult().steps);

  readonly #stepSummaries = computed(() => {
    return this.flowResult().steps.map((step, index) => {
      return {
        index,
        name: step.name,
        thumbnail: step.lhr.fullPageScreenshot!.screenshot,
        gatherMode: step.lhr.gatherMode,
        categories: step.lhr.categories,
      };
    });
  });
  readonly auditSummary = computed<AuditSummary>(() => {
    return { stepSummaries: this.#stepSummaries() };
  });
}
