import { Component } from '@angular/core';
import { CdkStepper, CdkStepperModule } from '@angular/cdk/stepper';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'viewer-custom-stepper',
  template: `
    <section>
      <header>
        <h2>Step {{ selectedIndex + 1 }}/{{ steps.length }}</h2>
      </header>

      <div [ngTemplateOutlet]="selected ? selected.content : null"></div>

      <footer class="example-step-navigation-bar">
        <button class="example-nav-button" cdkStepperPrevious>&larr;</button>
        @for (step of steps; track step; let i = $index) {
          <button
            class="example-step"
            [class.example-active]="selectedIndex === i"
            (click)="selectStepByIndex(i)">Step {{ i + 1 }}</button>
        }
        <button class="example-nav-button" cdkStepperNext>&rarr;</button>
      </footer>
    </section>
  `,
  styles: `
      .example-step-navigation-bar {
          display: flex;
          justify-content: flex-start;
          margin-top: 10px;
      }

      .example-step {
          background: transparent;
          border: 0;
          margin: 0 10px;
          padding: 10px;
          color: inherit;
      }

      .example-step.example-active {
          border-bottom: 1px solid;
          font-weight: 600;
      }

      .example-nav-button {
          background: transparent;
          border: 0;
          color: inherit;
      }
  `,
  providers: [{
    provide: CdkStepper,
    useExisting: ViewerCustomStepperComponent
  }],
  standalone: true,
  imports: [NgTemplateOutlet, CdkStepperModule],
})
export class ViewerCustomStepperComponent extends CdkStepper {
  selectStepByIndex(index: number): void {
    this.selectedIndex = index;
  }
}
