import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  DiagnosticItem,
  ViewerDiagnosticComponent,
  ViewerDiagnosticContext,
  ViewerMarkdownTextComponent,
} from '@app-speed/portal-ui/viewer-diagnostics';

@Component({
  selector: 'viewer-step-detail-section',
  template: `
    @if (items().length) {
      <section class="viewer-step-detail-section">
        <h2 class="viewer-step-detail-section__title">{{ title() }}</h2>

        @if (description(); as description) {
          <p class="viewer-step-detail-section__description">
            <ui-viewer-markdown-text [text]="description" />
          </p>
        }

        <ui-viewer-diagnostic [items]="items()" [context]="context()" />
      </section>
    }
  `,
  imports: [ViewerDiagnosticComponent, ViewerMarkdownTextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      margin-top: 12px;
      padding: 20px;
    }

    .viewer-step-detail-section__title {
      margin: 0 0 16px;
    }

    .viewer-step-detail-section__description {
      margin: 0 0 16px;
    }
  `,
})
export class ViewerStepDetailSectionComponent {
  title = input.required<string>();
  description = input<string>();
  items = input.required<DiagnosticItem[]>();
  context = input<ViewerDiagnosticContext | null>(null);
}
