import { Component, computed, input } from '@angular/core';
import { FlowResult } from 'lighthouse';
import { ViewerStepDetailComponent } from './viewer-container/viewer-step-details.component';
import { AuditSummaryComponent } from './viewer-container/audit-summary.component';
import { RxIf } from '@rx-angular/template/if';

@Component({
  selector: 'viewer-flow-result',
  standalone: true,
  template: `
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
}
