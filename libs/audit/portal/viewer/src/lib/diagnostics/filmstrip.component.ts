import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ScrollContainerComponent } from '@app-speed/ui/scroll-container';
import type Details from 'lighthouse/types/lhr/audit-details';

@Component({
  selector: 'ui-viewer-filmstrip',
  template: `
    <ui-scroll-container>
      <div class="filmstrip">
        @for (item of details().items; track item.timestamp) {
          <figure class="filmstrip__frame">
            <img class="filmstrip__image" [src]="item.data" [alt]="'Screenshot at ' + formatMilliseconds(item.timing)" />
            <figcaption class="filmstrip__time">{{ formatMilliseconds(item.timing) }}</figcaption>
          </figure>
        }
      </div>
    </ui-scroll-container>
  `,
  styles: `
    .filmstrip {
      display: flex;
      gap: 12px;
      padding: 8px 4px;
    }

    .filmstrip__frame {
      margin: 0;
      min-width: 160px;
    }

    .filmstrip__image {
      display: block;
      width: 160px;
      border: 1px solid color-mix(in srgb, var(--mat-sys-outline) 60%, white);
      border-radius: 10px;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
      background: white;
    }

    .filmstrip__time {
      margin-top: 8px;
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.8125rem;
      text-align: center;
    }
  `,
  imports: [ScrollContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerFilmstripComponent {
  details = input.required<Details.Filmstrip>();

  formatMilliseconds(value: number): string {
    return `${Math.round(value)} ms`;
  }
}
