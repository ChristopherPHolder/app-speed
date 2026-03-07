import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatChip } from '@angular/material/chips';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { StatusBadgeComponent, StatusOptions } from '@app-speed/portal-ui/status-badge';
import type Details from 'lighthouse/types/lhr/audit-details';
import { ViewerDetailsComponent } from './details.component';
import { MdToAnkerPipe } from './md-to-anker.pipe';

export type DiagnosticItem = {
  id: string;
  title: string;
  displayValue?: string;
  description: string;
  details?: Details;
  status: StatusOptions;
  affectedMetrics?: string[];
};

@Component({
  selector: 'ui-viewer-diagnostic-panel',
  template: `
    <mat-expansion-panel>
      <mat-expansion-panel-header>
        <mat-panel-title>
          <ui-status-badge class="status-badge" [status]="item().status" />
          <span>
            {{ item().title }}
            @if (item().displayValue) {
              <span style="color: red;">{{ item().displayValue }}</span>
            }
          </span>
        </mat-panel-title>
      </mat-expansion-panel-header>
      <p>
        <span [innerHTML]="item().description | mdToAnker"></span>
        @if (item().affectedMetrics; as metrics) {
          @for (metric of metrics; track metric) {
            <mat-chip [disableRipple]="true">{{ metric }}</mat-chip>
          }
        }
      </p>

      @if (item().details; as details) {
        <ui-viewer-details [details]="details" />
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

  imports: [
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatChip,
    MdToAnkerPipe,
    StatusBadgeComponent,
    ViewerDetailsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-diagnostic-type]': 'item().details?.type',
  },
})
export class ViewerDiagnosticPanelComponent {
  item = input.required<DiagnosticItem>();
}
