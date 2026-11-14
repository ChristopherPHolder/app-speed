import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ScrollContainerComponent } from '@app-speed/ui/scroll-container';

@Component({
  selector: 'viewer-film-strip',
  template: `
    <ui-scroll-container>
      <div class="film-strip-container">
        @for (item of filmStrip(); track item) {
          <img class="film-strip-frame" [src]="item.data" alt="" />
        }
      </div>
    </ui-scroll-container>
  `,
  styles: `
    :host {
      container-type: inline-size;
      display: block;
      padding: var(--ui-space-5) 0;
    }

    .film-strip-container {
      display: flex;
      gap: var(--ui-space-4);
      justify-content: space-between;
      overflow: auto;
      padding: var(--ui-space-2) var(--ui-space-1);
    }

    .film-strip-frame {
      flex: 0 0 auto;
      width: auto;
      height: clamp(100px, 15cqi, 160px);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-small);
    }
  `,
  imports: [ScrollContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerFilmStripComponent {
  filmStrip = input.required<{ data: string }[]>();
}
