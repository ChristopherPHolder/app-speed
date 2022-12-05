import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  logoSrc = 'https://deep-blue.io/static/80dd2dce56de67693d11cb3ec7ed1efe/507b0/deepblue-logo.webp';
  logoAlt = 'Deep Blue header navbar logo';
}
