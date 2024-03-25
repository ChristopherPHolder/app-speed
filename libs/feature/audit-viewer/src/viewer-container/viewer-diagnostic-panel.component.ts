import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  MatExpansionPanel,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { DiagnosticItemStatus, ViewerDiagnosticStatusBadgeComponent } from './viewer-diagnostic-status-badge.component';

export type DiagnosticItem = {
  id: string;
  title: string;
  displayValue?: string;
  description: string;
  status: DiagnosticItemStatus;
};

@Component({
  selector: 'lib-viewer-diagnostic-panel',
  template: `
    <mat-expansion-panel>
      <mat-expansion-panel-header >
        <mat-panel-title>
          <lib-viewer-diagnostic-status-badge class='status-badge' [status]='item().status' />
          <span>
            {{ item().title }}
            <!-- @TODO fis display for mobile -->
            @if (item().displayValue) {
              <span style='color: red;'> - {{ item().displayValue }}</span>
            }
          </span>
        </mat-panel-title>
      </mat-expansion-panel-header>
      <p>{{ item().description }}</p>
    </mat-expansion-panel>
  `,
  styles: `
    .status-badge {
        margin-right: 10px;
        overflow: visible;
    }
  `,
  standalone: true,
  imports: [
    MatExpansionPanel,
    MatExpansionPanelDescription,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    ViewerDiagnosticStatusBadgeComponent,
    MatIcon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewerDiagnosticPanelComponent {
  item = input.required<DiagnosticItem>();
}
