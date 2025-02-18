import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgScrollbarModule } from 'ngx-scrollbar';

@Component({
  selector: 'ui-scroll-container',
  template: `<ng-scrollbar><ng-content /></ng-scrollbar>`,
  styles: `
    ng-scrollbar {
      --scrollbar-track-color: rgb(0 0 0 / 5%);
      /* TODO - extract token correctly */
      --scrollbar-thumb-color: var(--mat-slider-ripple-color);
      --scrollbar-thickness: 12;
      --scrollbar-offset: 6;
      --scrollbar-border-radius: 8px;
      border-radius: 3px;
    }
  `,
  imports: [NgScrollbarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollContainerComponent {}
