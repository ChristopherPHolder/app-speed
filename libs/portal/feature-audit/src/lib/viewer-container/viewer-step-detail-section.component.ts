import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  DiagnosticItem,
  ViewerDiagnosticComponent,
  ViewerDiagnosticContext,
} from '@app-speed/portal-ui/viewer-diagnostics';
import { MdToAnkerPipe } from '../utils/md-to-anker.pipe';

@Component({
  selector: 'viewer-step-detail-section',
  template: `
    @if (items().length) {
      <section>
        <header>
          <h2 class="viewer-step-detail-section__title">{{ title() }}</h2>
          @if (description(); as description) {
            <div class="viewer-step-detail-section__description" [innerHTML]="description | mdToAnker"></div>
          }
        </header>
        <ui-viewer-diagnostic [items]="items()" [context]="context()" />
      </section>
    }
  `,
  imports: [ViewerDiagnosticComponent, MdToAnkerPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      min-width: 0;
      margin-top: 12px;
    }

    header,
    ui-viewer-diagnostic {
      padding: 20px;
    }

    header {
      display: grid;
      gap: 8px;
      padding-bottom: 0;
      min-width: 0;
    }

    .viewer-step-detail-section__title {
      margin: 0;
      color: var(--mat-sys-on-surface);
      font: var(--mat-sys-title-small, 600 0.875rem/1.25rem sans-serif);
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .viewer-step-detail-section__description {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium, 400 0.875rem/1.5rem sans-serif);
      overflow-wrap: anywhere;
      word-break: break-word;
    }
  `,
})
export class ViewerStepDetailSectionComponent {
  title = input.required<string>();
  description = input<string>();
  items = input.required<DiagnosticItem[]>();
  context = input<ViewerDiagnosticContext | null>(null);
}
