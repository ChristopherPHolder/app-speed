import { Component, input } from '@angular/core';

@Component({
  selector: 'lib-viewer-file-strip',
  template: `
    @for (item of filmStrip(); track item) {
      <img class='film-strip-frame' [src]='item.data' height='100px' alt=''>
    }
  `,
  standalone: true,
  styles: [`
      :host {
          display: flex;
          overflow: auto;
          -ms-overflow-style: none; /* Internet Explorer 10+ */
          scrollbar-width: none; /* Firefox */

          ::-webkit-scrollbar {
              display: none; /* Safari and Chrome */
          }
          padding: 4px;
      }

      .film-strip-frame {
          border: groove gray;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;

          &:not(:first-child):not(:last-child) {
              margin: 0 8px;
              /*padding: 16px;*/
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
