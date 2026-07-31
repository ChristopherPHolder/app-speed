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
      padding: 20px 0;
    }

    .film-strip-container {
      display: flex;
      gap: 16px;
      justify-content: space-between;
      overflow: auto;
      padding: 8px 4px;
    }

    .film-strip-frame {
      flex: 0 0 auto;
      height: clamp(100px, 15cqi, 160px);
      width: auto;
      border: groove gray;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;

      &:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
      }
    }
  `,
  imports: [ScrollContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerFilmStripComponent {
  filmStrip = input.required<{ data: string }[]>();
}
