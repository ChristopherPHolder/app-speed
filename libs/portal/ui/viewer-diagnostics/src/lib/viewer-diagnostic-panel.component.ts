import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatChip } from '@angular/material/chips';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { StatusBadgeComponent } from '@app-speed/portal-ui/status-badge';
import { ViewerDetailsComponent } from './details.component';
import { ViewerMarkdownTextComponent } from './markdown-text.component';
import { DiagnosticItem, ViewerDiagnosticContext } from './viewer-diagnostic.models';

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
        <ui-viewer-markdown-text [text]="item().description" />
        @if (item().affectedMetrics; as metrics) {
          @for (metric of metrics; track metric) {
            <mat-chip [disableRipple]="true">{{ metric }}</mat-chip>
          }
        }
      </p>

      @if (item().details; as details) {
        <ui-viewer-details [details]="details" [auditId]="item().id" [context]="context()" />
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
    ViewerMarkdownTextComponent,
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
  context = input<ViewerDiagnosticContext | null>(null);
}
