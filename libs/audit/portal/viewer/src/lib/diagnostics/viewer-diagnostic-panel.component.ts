import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatChip } from '@angular/material/chips';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { StatusBadgeComponent } from '@app-speed/ui/status-badge';
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
      <p class="viewer-diagnostic-panel__summary">
        <ui-viewer-markdown-text [text]="item().description" />
        @if (item().affectedMetrics?.length || item().unscored) {
          <span class="viewer-diagnostic-panel__chips">
            @if (item().affectedMetrics; as metrics) {
              @for (metric of metrics; track metric) {
                <mat-chip [disableRipple]="true">{{ metric }}</mat-chip>
              }
            }
            @if (item().unscored) {
              <mat-chip [disableRipple]="true" title="This diagnostic does not directly affect the performance score">
                Unscored
              </mat-chip>
            }
          </span>
        }
      </p>

      @if (item().stackPacks?.length; as stackPackCount) {
        <div class="viewer-diagnostic-panel__stackpacks" [attr.data-stack-pack-count]="stackPackCount">
          @for (stackPack of item().stackPacks; track stackPack.title) {
            <section class="viewer-diagnostic-panel__stackpack">
              <img class="viewer-diagnostic-panel__stackpack-icon" [src]="stackPack.iconDataURL" [alt]="stackPack.title" />
              <div class="viewer-diagnostic-panel__stackpack-copy">
                <div class="viewer-diagnostic-panel__stackpack-title">{{ stackPack.title }}</div>
                <ui-viewer-markdown-text [text]="stackPack.description" />
              </div>
            </section>
          }
        </div>
      }

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

    .viewer-diagnostic-panel__summary {
      display: grid;
      gap: 12px;
    }

    .viewer-diagnostic-panel__chips {
      display: inline-flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .viewer-diagnostic-panel__stackpacks {
      display: grid;
      gap: 12px;
      margin: 0 0 16px;
    }

    .viewer-diagnostic-panel__stackpack {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 12px;
      align-items: start;
      padding: 12px;
      border: 1px solid color-mix(in srgb, var(--mat-sys-outline) 55%, white);
      border-radius: 12px;
      background: color-mix(in srgb, var(--mat-sys-surface-variant) 20%, white);
    }

    .viewer-diagnostic-panel__stackpack-icon {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .viewer-diagnostic-panel__stackpack-copy {
      display: grid;
      gap: 4px;
    }

    .viewer-diagnostic-panel__stackpack-title {
      font-size: 0.875rem;
      font-weight: 700;
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
