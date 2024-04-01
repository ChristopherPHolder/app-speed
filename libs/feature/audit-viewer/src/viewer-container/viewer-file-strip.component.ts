import { Component, input } from '@angular/core';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { NgFor } from '@angular/common';

@Component({
  selector: 'lib-viewer-file-strip',
  template: `
    <ng-scrollbar>
      <div class="film-strip-container">
        @for (item of filmStrip(); track item) {
          <img class='film-strip-frame' [src]='item.data' height='100px' alt=''>
        }
      </div>
    </ng-scrollbar>
  `,
  imports: [NgScrollbarModule, NgFor],
  standalone: true,
  styles: [`
      ng-scrollbar {
          --scrollbar-track-color: rgb(0 0 0 / 5%);
          /* TODO - extract token correctly */
          --scrollbar-thumb-color: var(--mat-slider-ripple-color);
          --scrollbar-thickness: 12;
          --scrollbar-offset: 6;
          --scrollbar-border-radius: 8px;
          border-radius: 3px;
      }
      
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
  `]
})
export class ViewerFileStripComponent {
  filmStrip = input.required<{data: string}[]>()
}
