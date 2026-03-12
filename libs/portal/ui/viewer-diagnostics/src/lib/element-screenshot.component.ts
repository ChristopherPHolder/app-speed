import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type Result from 'lighthouse/types/lhr/lhr';

type Rect = Result.FullPageScreenshot['nodes'][string];

type ScreenshotViewModel = {
  imageSrc: string;
  imageLeft: number;
  imageTop: number;
  imageWidth: number;
  imageHeight: number;
  previewWidth: number;
  previewHeight: number;
  markerLeft: number;
  markerTop: number;
  markerWidth: number;
  markerHeight: number;
  maskTopHeight: number;
  maskBottomTop: number;
  maskBottomHeight: number;
  maskLeftWidth: number;
  maskRightLeft: number;
  maskRightWidth: number;
};

@Component({
  selector: 'ui-viewer-element-screenshot',
  template: `
    @if (viewModel(); as view) {
      <div class="element-screenshot">
        <div
          class="element-screenshot__viewport"
          [style.width.px]="view.previewWidth"
          [style.height.px]="view.previewHeight"
        >
          <img
            class="element-screenshot__image"
            [src]="view.imageSrc"
            alt=""
            draggable="false"
            [style.left.px]="view.imageLeft"
            [style.top.px]="view.imageTop"
            [style.width.px]="view.imageWidth"
            [style.height.px]="view.imageHeight"
          />
          <div class="element-screenshot__mask" [style.height.px]="view.maskTopHeight"></div>
          <div
            class="element-screenshot__mask"
            [style.top.px]="view.maskBottomTop"
            [style.height.px]="view.maskBottomHeight"
          ></div>
          <div
            class="element-screenshot__mask"
            [style.top.px]="view.markerTop"
            [style.width.px]="view.maskLeftWidth"
            [style.height.px]="view.markerHeight"
          ></div>
          <div
            class="element-screenshot__mask"
            [style.top.px]="view.markerTop"
            [style.left.px]="view.maskRightLeft"
            [style.width.px]="view.maskRightWidth"
            [style.height.px]="view.markerHeight"
          ></div>
          <div
            class="element-screenshot__marker"
            [style.left.px]="view.markerLeft"
            [style.top.px]="view.markerTop"
            [style.width.px]="view.markerWidth"
            [style.height.px]="view.markerHeight"
          ></div>
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .element-screenshot {
      display: inline-flex;
      overflow: hidden;
      border-radius: 8px;
      background: var(--mat-sys-surface);
    }

    .element-screenshot__viewport {
      position: relative;
      background-color: white;
      outline: 1px solid color-mix(in srgb, var(--mat-sys-outline) 60%, white);
      overflow: hidden;
    }

    .element-screenshot__image {
      position: absolute;
      max-width: none;
      user-select: none;
      pointer-events: none;
    }

    .element-screenshot__mask {
      position: absolute;
      inset-inline: 0;
      background: color-mix(in srgb, black 62%, transparent);
      opacity: 0.72;
      pointer-events: none;
    }

    .element-screenshot__marker {
      position: absolute;
      outline: 2px solid #9ef01a;
      pointer-events: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerElementScreenshotComponent {
  screenshot = input.required<Result.FullPageScreenshot['screenshot']>();
  rect = input.required<Rect>();
  maxWidth = input.required<number>();
  maxHeight = input.required<number>();

  readonly viewModel = computed<ScreenshotViewModel | null>(() => {
    const screenshot = this.screenshot();
    const rect = this.rect();
    if (!this.overlaps(screenshot, rect) || rect.width <= 0 || rect.height <= 0) {
      return null;
    }

    const zoomFactor = this.computeZoomFactor(rect, {
      width: this.maxWidth(),
      height: this.maxHeight(),
    });

    const previewSizeInScreenshotSpace = {
      width: Math.min(screenshot.width, this.maxWidth() / zoomFactor),
      height: Math.min(screenshot.height, this.maxHeight() / zoomFactor),
    };

    const previewSize = {
      width: previewSizeInScreenshotSpace.width * zoomFactor,
      height: previewSizeInScreenshotSpace.height * zoomFactor,
    };

    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    const screenshotLeft = this.clamp(
      center.x - previewSizeInScreenshotSpace.width / 2,
      0,
      screenshot.width - previewSizeInScreenshotSpace.width,
    );
    const screenshotTop = this.clamp(
      center.y - previewSizeInScreenshotSpace.height / 2,
      0,
      screenshot.height - previewSizeInScreenshotSpace.height,
    );

    const markerLeft = (rect.left - screenshotLeft) * zoomFactor;
    const markerTop = (rect.top - screenshotTop) * zoomFactor;
    const markerWidth = rect.width * zoomFactor;
    const markerHeight = rect.height * zoomFactor;

    return {
      imageSrc: screenshot.data,
      imageLeft: -screenshotLeft * zoomFactor,
      imageTop: -screenshotTop * zoomFactor,
      imageWidth: screenshot.width * zoomFactor,
      imageHeight: screenshot.height * zoomFactor,
      previewWidth: previewSize.width,
      previewHeight: previewSize.height,
      markerLeft,
      markerTop,
      markerWidth,
      markerHeight,
      maskTopHeight: markerTop,
      maskBottomTop: markerTop + markerHeight,
      maskBottomHeight: Math.max(previewSize.height - markerTop - markerHeight, 0),
      maskLeftWidth: markerLeft,
      maskRightLeft: markerLeft + markerWidth,
      maskRightWidth: Math.max(previewSize.width - markerLeft - markerWidth, 0),
    };
  });

  private computeZoomFactor(rect: Rect, maxSize: { width: number; height: number }): number {
    const targetClipToViewportRatio = 0.75;
    const zoomRatioX = maxSize.width / rect.width;
    const zoomRatioY = maxSize.height / rect.height;
    return Math.min(1, targetClipToViewportRatio * Math.min(zoomRatioX, zoomRatioY));
  }

  private clamp(value: number, min: number, max: number): number {
    if (value < min) {
      return min;
    }

    if (value > max) {
      return max;
    }

    return value;
  }

  private overlaps(
    screenshot: Result.FullPageScreenshot['screenshot'],
    rect: Rect,
  ): boolean {
    return (
      rect.left <= screenshot.width &&
      0 <= rect.right &&
      rect.top <= screenshot.height &&
      0 <= rect.bottom
    );
  }
}
