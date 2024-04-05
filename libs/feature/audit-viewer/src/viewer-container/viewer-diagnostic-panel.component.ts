import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  MatExpansionPanel,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { StatusBadgeComponent, StatusOptions } from '@app-speed/ui/status-badge';
import Details from 'lighthouse/types/lhr/audit-details';
import { MdToAnkerPipe } from '../utils/md-to-anker.pipe';
import { DetailsComponent } from '../ui/details.component';

export type DiagnosticItem = {
  id: string;
  title: string;
  displayValue?: string;
  description: string;
  details?: Details;
  status: StatusOptions;
};

@Component({
  selector: 'viewer-diagnostic-panel',
  template: `
    <mat-expansion-panel>
      <mat-expansion-panel-header>
        <mat-panel-title>
          <ui-status-badge class='status-badge' [status]='item().status' />
          <span>
            {{ item().title }}
            @if (item().displayValue) {
              <span style='color: red;'>{{ item().displayValue }}</span>
            }
          </span>
        </mat-panel-title>
      </mat-expansion-panel-header>
      <p [innerHTML]='item().description | mdToAnker'></p>
      @if (item().details; as details) {
        <viewer-details [details]='details' />
      }
    </mat-expansion-panel>
  `,
  styles: `
    .status-badge {
        margin-right: 8px;
        overflow: visible;
    }
    mat-expansion-panel-header {
        padding: 0 24px 0 16px;
        @media (max-width: 768px) {
          --mat-expansion-header-collapsed-state-height: 64px;
          --mat-expansion-header-expanded-state-height: 80px;
        }
    }
    
  `,
  standalone: true,
  imports: [
    MatExpansionPanel,
    MatExpansionPanelDescription,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MdToAnkerPipe,
    StatusBadgeComponent,
    DetailsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewerDiagnosticPanelComponent {
  item = input.required<DiagnosticItem>();
}
