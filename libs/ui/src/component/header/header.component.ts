import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <div class='header-navbar'>
      <img loading="eager" [src]='logo.src' [alt]='logo.alt'>
    </div>
  `,
  styles: [
    `.header-navbar {
        padding: 10px;
        height: 48px;
        border-bottom: 1px solid #dadce0;
        display: flex;
    }`,
  ]
})
export class HeaderComponent {
  public readonly logo = {
    src: '/assets/app-speed-logo.svg',
    alt: 'App Speed Header Navigation Logo',
  }
}
