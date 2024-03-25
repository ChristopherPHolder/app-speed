import { Component, input } from '@angular/core';

@Component({
  selector: 'lib-viewer-file-strip',
  template: `
    <div class='film-strip'>
      @for (item of filmStrip(); track item) {
        <img [src]='item.data' height='100px' alt='' style='padding: 0 10px;'>
      }
    </div>
  `,
  standalone: true,
  styles: [`
    .film-strip {
        display: flex;
        overflow: auto;
    }
    .film-strip {
        -ms-overflow-style: none;  /* Internet Explorer 10+ */
        scrollbar-width: none;  /* Firefox */
    }
    .film-strip::-webkit-scrollbar {
        display: none;  /* Safari and Chrome */
    }
  `]
})
export class ViewerFileStripComponent {
  filmStrip = input.required<{data: string}[]>()
}
