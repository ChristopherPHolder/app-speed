import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { ViewerDiagnosticPanelComponent } from './viewer-diagnostic-panel.component';
import { DiagnosticItem, ViewerDiagnosticContext } from './viewer-diagnostic.models';

@Component({
  selector: 'ui-viewer-diagnostic',
  template: `
    <mat-accordion>
      @for (item of items(); track item.id) {
        <ui-viewer-diagnostic-panel [item]="item" [context]="context()" />
      }
    </mat-accordion>
  `,
  imports: [MatAccordion, ViewerDiagnosticPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerDiagnosticComponent {
  items = input.required<DiagnosticItem[]>();
  context = input<ViewerDiagnosticContext | null>(null);
}
