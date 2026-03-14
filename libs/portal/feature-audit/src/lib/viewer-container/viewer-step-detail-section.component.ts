import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  DiagnosticItem,
  ViewerDiagnosticComponent,
  ViewerDiagnosticContext,
  ViewerMarkdownTextComponent,
} from '@app-speed/portal-ui/viewer-diagnostics';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';

@Component({
  selector: 'viewer-step-detail-section',
  template: `
    @if (items().length) {
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ title() }}</mat-card-title>
        </mat-card-header>

        <mat-card-content>
          @if (description(); as description) {
            <p>
              <ui-viewer-markdown-text [text]="description" />
            </p>
          }
          <ui-viewer-diagnostic [items]="items()" [context]="context()" />
        </mat-card-content>
      </mat-card>
    }
  `,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    ViewerDiagnosticComponent,
    ViewerMarkdownTextComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      margin-top: 12px;
    }
  `,
})
export class ViewerStepDetailSectionComponent {
  title = input.required<string>();
  description = input<string>();
  items = input.required<DiagnosticItem[]>();
  context = input<ViewerDiagnosticContext | null>(null);
}
