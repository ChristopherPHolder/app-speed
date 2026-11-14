import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgScrollbarModule } from 'ngx-scrollbar';

@Component({
  selector: 'ui-scroll-container',
  template: `<ng-scrollbar><ng-content /></ng-scrollbar>`,
  styles: `
    ng-scrollbar {
      --scrollbar-track-color: var(--mat-sys-surface-container-high);
      --scrollbar-thumb-color: var(--mat-sys-outline);
      --scrollbar-thickness: 12;
      --scrollbar-offset: 6;
      --scrollbar-border-radius: var(--mat-sys-corner-small);
      border-radius: var(--mat-sys-corner-extra-small);
    }
  `,
  imports: [NgScrollbarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollContainerComponent {}
