import { Component, computed, input } from '@angular/core';
import { FlowResult } from 'lighthouse';
import { ViewerStepDetailComponent } from './viewer-container/viewer-step-details.component';

@Component({
  selector: 'viewer-flow-result',
  template: `
    @for (step of steps(); track step.name) {
      <viewer-step-detail [stepDetails]="step" />
    }
  `,
  styles: ``,
  imports: [ViewerStepDetailComponent],
})
export class FlowResultComponent {
  flowResult = input.required<FlowResult>();
  steps = computed<FlowResult['steps']>(() => this.flowResult().steps);
}
