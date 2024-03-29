import { Component, input } from '@angular/core';

@Component({
  selector: 'lib-viewer-file-strip',
  template: `
    @for (item of filmStrip(); track item) {
      <img [src]='item.data' height='100px' alt='' style='padding: 0 10px;'>
    }
  `,
  standalone: true,
  styles: [`
    :host {
        display: flex;
        overflow: auto;
        -ms-overflow-style: none;  /* Internet Explorer 10+ */
        scrollbar-width: none;  /* Firefox */
        ::-webkit-scrollbar {
            display: none;  /* Safari and Chrome */
        }
    }
  `]
})
export class ViewerFileStripComponent {
  filmStrip = input.required<{data: string}[]>()
}
