import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { DiagnosticItem, ViewerDiagnosticPanelComponent } from './viewer-diagnostic-panel.component';

@Component({
  selector: 'viewer-diagnostic',
  template: `
    <mat-accordion>
      @for (item of items(); track item.id) {
        <viewer-diagnostic-panel [item]="item" />
      }
    </mat-accordion>
  `,
  imports: [MatAccordion, ViewerDiagnosticPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerDiagnosticComponent {
  items = input.required<DiagnosticItem[]>();
}
