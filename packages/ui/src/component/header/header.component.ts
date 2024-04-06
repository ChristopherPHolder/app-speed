import { Component } from '@angular/core';

@Component({
  selector: 'ui-header',
  standalone: true,
  template: `
    <div class='header-navbar box--small'>
      <img loading="eager" [src]='logo.src' [alt]='logo.alt'>
    </div>
  `,
  styles: [
    `.header-navbar {
        padding: 10px;
        height: 38px;
        border-bottom: 1px solid #dadce0;
        display: flex;
    }`,
  ]
})
export class HeaderComponent {
  public readonly logo = {
    src: '/assets/app-speed-logo-with-name.svg',
    alt: 'App Speed Header Navigation Logo',
  }
}
