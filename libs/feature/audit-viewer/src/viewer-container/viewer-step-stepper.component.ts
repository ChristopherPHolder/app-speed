import { Component, forwardRef } from '@angular/core';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { ViewerCustomStepperComponent } from './viewer-custom-stepper.component';

@Component({
  selector: 'viewer-step-stepper',
  template: `
    <viewer-custom-stepper>
      <cdk-step> <p>This is any content of "Step 1"</p> </cdk-step>
      <cdk-step> <p>This is any content of "Step 2"</p> </cdk-step>
    </viewer-custom-stepper>
  `,
  standalone: true,
  imports: [
    forwardRef(() => ViewerCustomStepperComponent),
    CdkStepperModule,
    ViewerCustomStepperComponent
  ],
})
export class ViewerStepStepperComponent {}
