import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <div class='header-navbar'>
      <img
        class='header-navbar-logo' 
        loading="eager"
        [src]='logoSrc' 
        [alt]='logoAlt'
      >
    </div>
  `,
  styles: [
    `.header-navbar { height: 48px; border-bottom: 1px solid #dadce0; display: flex; }`,
    `.header-navbar-logo { margin: -20px; height: 165%; }`
  ]
})
export class HeaderComponent {
  logoSrc = 'https://deep-blue.io/static/80dd2dce56de67693d11cb3ec7ed1efe/507b0/deepblue-logo.webp';
  logoAlt = 'Deep Blue header navbar logo';
}
