import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import type Details from 'lighthouse/types/lhr/audit-details';
import type Result from 'lighthouse/types/lhr/lhr';
import { ViewerElementScreenshotComponent } from './element-screenshot.component';
import { ViewerDiagnosticContext } from './viewer-diagnostic.models';

@Component({
  selector: 'ui-viewer-detail-node',
  template: `
    <div
      class="node"
      [attr.title]="node().selector || null"
      [attr.data-path]="node().path || null"
      [attr.data-selector]="node().selector || null"
      [attr.data-snippet]="node().snippet || null"
    >
      @let rect = screenshotRect();
      @let screenshotData = screenshot();
      @if (hasScreenshotPreview() && rect && screenshotData) {
        <button
          type="button"
          class="node__screenshot-button"
          (click)="openOverlay()"
          aria-label="Open element screenshot"
        >
          <ui-viewer-element-screenshot
            [screenshot]="screenshotData"
            [rect]="rect"
            [maxWidth]="147"
            [maxHeight]="100"
          />
        </button>
      } @else if (imagePreviewUrl(); as previewUrl) {
        <img class="node__asset-thumbnail" [src]="previewUrl" alt="" loading="lazy" />
      }

      <div class="node__body">
        @if (node().nodeLabel) {
          <div class="node__label">{{ node().nodeLabel }}</div>
        }

        @if (node().snippet) {
          <code class="node__snippet">{{ node().snippet }}</code>
        }

        @if (node().explanation) {
          <div class="node__explanation">{{ node().explanation }}</div>
        }
      </div>
    </div>

    @if (overlayOpen() && hasScreenshotPreview() && rect && screenshotData) {
      <div class="node__overlay" (click)="closeOverlay()">
        <div class="node__overlay-card" (click)="$event.stopPropagation()">
          <ui-viewer-element-screenshot
            [screenshot]="screenshotData"
            [rect]="rect"
            [maxWidth]="1100"
            [maxHeight]="720"
          />
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .node {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      min-width: 0;
    }

    .node__screenshot-button {
      display: inline-flex;
      padding: 0;
      border: 0;
      background: transparent;
      cursor: zoom-in;
    }

    .node__asset-thumbnail {
      display: block;
      flex: 0 0 auto;
      width: 147px;
      height: 100px;
      border: 1px solid color-mix(in srgb, var(--mat-sys-outline) 60%, white);
      border-radius: 8px;
      background: white;
      object-fit: cover;
    }

    .node__body {
      display: grid;
      gap: 4px;
      min-width: 0;
      flex: 1 1 auto;
    }

    .node__label {
      color: var(--mat-sys-on-surface);
      font-weight: 600;
    }

    .node__snippet {
      display: block;
      overflow-wrap: anywhere;
      white-space: pre-wrap;
      padding: 8px 10px;
      border-radius: 8px;
      background: color-mix(in srgb, var(--mat-sys-surface-variant) 70%, white);
      font-family: var(--mat-sys-body-medium-font, monospace);
      font-size: 0.8125rem;
    }

    .node__explanation {
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.875rem;
    }

    .node__overlay {
      position: fixed;
      inset: 0;
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: color-mix(in srgb, black 72%, transparent);
      cursor: zoom-out;
    }

    .node__overlay-card {
      max-width: 95vw;
      max-height: 90vh;
      cursor: default;
    }

    @media (max-width: 768px) {
      .node {
        flex-direction: column;
      }
    }
  `,
  imports: [ViewerElementScreenshotComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerDetailNodeComponent {
  node = input.required<Details.NodeValue>();
  context = input<ViewerDiagnosticContext | null>(null);
  previewUrl = input<string | undefined>(undefined);

  readonly overlayOpen = signal(false);

  readonly screenshot = computed<Result.FullPageScreenshot['screenshot'] | null>(() => {
    const screenshot = this.context()?.fullPageScreenshot?.screenshot;
    return screenshot ?? null;
  });

  readonly screenshotRect = computed<Result.FullPageScreenshot['nodes'][string] | null>(() => {
    const lhId = this.node().lhId;
    if (!lhId) {
      return null;
    }

    return this.context()?.fullPageScreenshot?.nodes[lhId] ?? null;
  });

  readonly hasScreenshotPreview = computed(() => {
    const screenshot = this.screenshot();
    const rect = this.screenshotRect();

    return (
      !!screenshot &&
      !!rect &&
      rect.width > 0 &&
      rect.height > 0 &&
      this.overlaps(rect, screenshot.width, screenshot.height)
    );
  });

  readonly imagePreviewUrl = computed(() => this.previewUrl() ?? null);

  openOverlay(): void {
    if (this.hasScreenshotPreview()) {
      this.overlayOpen.set(true);
    }
  }

  closeOverlay(): void {
    this.overlayOpen.set(false);
  }

  private overlaps(
    rect: Result.FullPageScreenshot['nodes'][string],
    screenshotWidth: number,
    screenshotHeight: number,
  ): boolean {
    return rect.bottom > 0 && rect.right > 0 && rect.top < screenshotHeight && rect.left < screenshotWidth;
  }
}
