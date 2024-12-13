import { Component, inject, input, model } from '@angular/core';
import { SwiperComponent } from './swiper.component';
import { SwiperOptions } from 'swiper/types';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { FractionalResultChipComponent } from '@app-speed/portal-ui/fractional-result-chip';
import { RadialChartComponent } from '@app-speed/portal-ui/radial-chart';

export type AuditSummary = {
  screenShot: string;
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

@Component({
  selector: 'ui-audit-summary',
  standalone: true,
  imports: [SwiperComponent, RadialChartComponent, FractionalResultChipComponent],
  template: `
    <ui-swiper class="swiper" [swiperOptions]="swiperConfig">
      @for (step of auditSummary(); track step) {
        <div class="swiper-slide">
          <div style="display: block; position: relative">
            <div>
              <div class="circle bottom"></div>
              @if (!$first) {
                <div class="line left"></div>
              }
              @if ($index <= auditSummary().length - 2) {
                <div class="line right"></div>
              }
              <div class="circle bottom"></div>
            </div>
            <span>
              <div class="screen-shot-box">
                <img class="screen-shot" [src]="step.screenShot" alt="" />
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
    .screen-shot-box {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 125px;
      height: 250px;
      margin: auto;
    }

    .screen-shot {
      border-radius: 8px;
      transition:
        transform 0.2s ease,
        height 100ms ease,
        width 100ms ease,
        box-shadow 0.2s ease;
      margin: auto;
      display: block;
      width: 50%;
      height: 50%;

      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      .swiper-slide-active & {
        height: 100%;
        width: 100%;
        border: groove blue;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
    }

    .circle {
      transition:
        bottom 100ms ease,
        right 100ms ease,
        left 100ms ease;
      width: 16px;
      height: 16px;
      background-color: blue;
      border-radius: 50%;
      position: absolute;
      z-index: 1;

      &.bottom {
        bottom: calc(-12px + 125px / 2);
        left: calc(50% + 4px);
        transform: translateX(-50%);
      }

      &.left {
        bottom: calc(50% - 4px);
        right: calc(50% + 4px + 125px / 4);
        transform: translate(50%, 50%);
      }

      &.right {
        bottom: calc(50% - 4px);
        left: calc(50% + 4px + 125px / 4);
        transform: translate(-50%, 50%);
      }

      .swiper-slide-active & {
        &.bottom {
          bottom: -12px;
        }
      }
    }

    .line {
      height: 4px;
      background-color: blue;
      position: absolute;
      transform: translate(0, 50%);
      bottom: calc(50% - 4px);
      width: calc(50% - 125px / 4);

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
      gap: 16px;
      font-size: x-small;
      font-weight: bold;
      text-align: center;
      padding-top: 20px;

      @media only screen and (max-width: 599px) {
        gap: 8px;
      }
    }

    .summary-title {
      font-size: x-large;
      text-align: center;
      margin: 16px 0 8px 0;
    }
    .summary-subtitle {
      font-size: medium;
      text-align: center;
      margin-bottom: 12px;
    }
  `,
})
export class AuditSummaryComponent {
  auditSummary = input.required<AuditSummary>();
  activeIndex = model<number>(0);
  #breakpointObserver = inject(BreakpointObserver);
  isMobile = this.#breakpointObserver.isMatched([Breakpoints.Small, Breakpoints.XSmall]);
  swiperConfig: SwiperOptions = {
    centeredSlides: true,
    slidesPerView: this.isMobile ? 1 : 3,
    on: {
      init: () => this.activeIndex.set(0),
      activeIndexChange: (swiper) => this.activeIndex.set(swiper.activeIndex),
    },
  };
}
