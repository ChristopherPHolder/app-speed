import { Component, computed, inject, input, model } from '@angular/core';
import { SwiperComponent } from './swiper.component';
import { FractionalResultChipComponent } from './fractional-result-chip.component';
import { SwiperOptions } from 'swiper/types';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { RadialChartComponent } from './radial-chart.component';

export type AuditSummary = {
  screenShot: string;
  screenShotSize: {
    width: number;
    height: number;
  };
  title: string;
  subTitle: string;
  shouldDisplayAsFraction: boolean;
  categoryScores: {
    name: string;
    asFraction: {
      numPassed: number;
      numPassableAudits: number;
      numInformative: number;
      totalWeight: number;
    };
    score: number;
  }[];
}[];

const SCREENSHOT_PREVIEW_MAX_SIZE = 250;

export function fitScreenshotPreview(width: number, height: number): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    return { width: 0, height: 0 };
  }

  return width >= height
    ? { width: SCREENSHOT_PREVIEW_MAX_SIZE, height: (SCREENSHOT_PREVIEW_MAX_SIZE * height) / width }
    : { width: (SCREENSHOT_PREVIEW_MAX_SIZE * width) / height, height: SCREENSHOT_PREVIEW_MAX_SIZE };
}

@Component({
  selector: 'ui-audit-summary',
  imports: [SwiperComponent, RadialChartComponent, FractionalResultChipComponent],
  template: `
    <ui-swiper class="swiper" [swiperOptions]="swiperConfig()">
      @for (step of auditSummary(); track step) {
        <div class="swiper-slide">
          <div style="display: block; position: relative">
            <div>
              @if (!$first) {
                <div class="line left"></div>
              }
              @if ($index <= auditSummary().length - 2) {
                <div class="line right"></div>
              }
              @if (activeIndex() === $index) {
                <div class="circle bottom"></div>
              }
            </div>
            <span>
              <div class="screen-shot-box">
                <img
                  class="screen-shot"
                  [src]="step.screenShot"
                  [style.width.px]="step.screenShotSize.width"
                  [style.height.px]="step.screenShotSize.height"
                  alt=""
                />
              </div>
            </span>
          </div>

          <div class="summary-title">{{ step.title }}</div>
          <div class="summary-subtitle">{{ step.subTitle }}</div>

          @if (activeIndex() === $index) {
            <div class="score-container">
              @if (step.shouldDisplayAsFraction) {
                @for (category of step.categoryScores; track category) {
                  <span>
                    <ui-fractional-result-chip [results]="category.asFraction" />
                    <div>{{ category.name }}</div>
                  </span>
                }
              } @else {
                @for (category of step.categoryScores; track category) {
                  <span><ui-radial-chart [score]="category.score" size="md" /> {{ category.name }} </span>
                }
              }
            </div>
          }
        </div>
      }
    </ui-swiper>
  `,
  styles: `
    .swiper-slide {
      /* Keep the active outline and elevation inside Swiper's clipped viewport. */
      padding-top: var(--ui-space-2);
    }

    .screen-shot-box {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 250px;
      height: 250px;
      max-width: 100%;
      margin: auto;
    }

    .screen-shot {
      position: relative;
      z-index: 2;
      display: block;
      max-width: 100%;
      max-height: 100%;
      margin: auto;
      border-radius: var(--mat-sys-corner-small);
      outline: 1px solid var(--mat-sys-outline-variant);
      box-shadow: var(--mat-sys-level1);
      transform: scale(0.5);
      transition:
        transform var(--ui-motion-duration-short4) var(--ui-motion-easing-standard),
        box-shadow var(--ui-motion-duration-short4) var(--ui-motion-easing-standard);

      .swiper-slide-active & {
        outline: 2px solid var(--mat-sys-primary);
        outline-offset: 2px;
        box-shadow: var(--mat-sys-level2);
        transform: scale(1);
      }
    }

    .circle {
      position: absolute;
      z-index: 1;
      width: 12px;
      height: 12px;
      border-radius: var(--mat-sys-corner-full);
      background-color: var(--mat-sys-primary);
      transition:
        bottom var(--ui-motion-duration-short2) var(--ui-motion-easing-standard),
        right var(--ui-motion-duration-short2) var(--ui-motion-easing-standard),
        left var(--ui-motion-duration-short2) var(--ui-motion-easing-standard);

      &.bottom {
        bottom: calc(-12px + 125px / 2);
        left: calc(50% + 4px);
        transform: translateX(-50%);
      }

      .swiper-slide-active & {
        &.bottom {
          bottom: -12px;
        }
      }
    }

    .line {
      position: absolute;
      bottom: calc(50% - 4px);
      width: calc(50% - 125px / 4);
      height: 2px;
      background-color: var(--mat-sys-outline-variant);
      transform: translate(0, 50%);

      &.right {
        left: calc(50% + 125px / 4);
      }

      &.left {
        right: calc(50% + 125px / 4);
      }

      .swiper-slide-active & {
        &.right {
          left: calc(50% + 125px / 2);
        }

        &.left {
          right: calc(50% + 125px / 2);
        }
      }
    }

    .score-container {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--ui-space-4);
      padding-top: var(--ui-space-5);
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-medium);
      text-align: center;

      @media (width < 600px) {
        gap: var(--ui-space-2);
      }
    }

    .score-container > span {
      display: grid;
      justify-items: center;
      gap: var(--ui-space-1);
    }

    .summary-title {
      margin: var(--ui-space-4) 0 var(--ui-space-1);
      font: var(--mat-sys-title-large);
      text-align: center;
    }

    .summary-subtitle {
      margin-bottom: var(--ui-space-3);
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
      text-align: center;
    }

    @media (prefers-reduced-motion: reduce) {
      .screen-shot,
      .circle {
        transition: none;
      }
    }
  `,
})
export class AuditSummaryComponent {
  auditSummary = input.required<AuditSummary>();
  activeIndex = model<number>(0);
  #breakpointObserver = inject(BreakpointObserver);
  isMobile = this.#breakpointObserver.isMatched([Breakpoints.Small, Breakpoints.XSmall]);
  swiperConfig = computed<SwiperOptions>(() => ({
    centeredSlides: true,
    initialSlide: this.activeIndex(),
    slideToClickedSlide: true,
    slidesPerView: this.isMobile ? 1 : 3,
    on: {
      activeIndexChange: (swiper) => this.activeIndex.set(swiper.activeIndex),
    },
  }));
}
