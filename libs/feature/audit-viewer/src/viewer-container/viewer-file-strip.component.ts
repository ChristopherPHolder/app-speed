import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ScrollContainerComponent } from '../ui/scroll-container.component';

@Component({
  selector: 'viewer-file-strip',
  template: `
    <viewer-scroll-container>
      <div class="film-strip-container">
        @for (item of filmStrip(); track item) {
          <img class='film-strip-frame' [src]='item.data' height='100px' alt=''>
        }
      </div>
    </viewer-scroll-container>
  `,
  styles: `
    .film-strip-container {
      display: flex;
      overflow: auto;
      padding: 8px 4px;
    }

    .film-strip-frame {
      border: groove gray;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;

      &:not(:first-child):not(:last-child) {
          margin: 0 8px;
      }

      &:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
      }
    }
  `,
  standalone: true,
  imports: [ScrollContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerFileStripComponent {
  filmStrip = input.required<{data: string}[]>()
}
