import {
  afterNextRender,
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  input,
  NgZone,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { SwiperOptions } from 'swiper/types';
import Swiper from 'swiper';

@Component({
  selector: 'ui-swiper',
  template: `
    <div #swiperContainer class="swiper">
      <div class="swiper-wrapper">
        <ng-content />
      </div>
      <div class="swiper-pagination"></div>
    </div>
  `,
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  styles: `
    @import 'swiper/css';
  `,
})
export class SwiperComponent implements AfterViewInit, OnDestroy {
  readonly #ngZone = inject(NgZone);

  swiper!: Swiper;

  @ViewChild('swiperContainer') swiperRef!: ElementRef;
  showPagination = input<boolean>(true);

  swiperOptions = input.required<SwiperOptions>();

  ngAfterViewInit() {
    this.#ngZone.runOutsideAngular(() => {
      this.swiper = new Swiper(this.swiperRef.nativeElement, this.swiperOptions());
    });
  }

  ngOnDestroy() {
    this.swiper.destroy();
  }
}
