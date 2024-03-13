import { Component, input } from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { DiagnosticItem, ViewerDiagnosticPanelComponent } from './viewer-diagnostic-panel.component';

@Component({
  selector: 'lib-viewer-diagnostic',
  template: `
    <mat-accordion>
      @for (item of items(); track item.id) {
        <lib-viewer-diagnostic-panel [item]='item'/>
      }
    </mat-accordion>
  `,
  standalone: true,
  imports: [
    MatAccordion,
    ViewerDiagnosticPanelComponent,
  ],
})
export class ViewerDiagnosticComponent {
  items = input.required<DiagnosticItem[]>();
}
