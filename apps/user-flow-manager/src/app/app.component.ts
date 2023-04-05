import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <app-header/>
    <router-outlet/>
  `,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'user-flow-manager';
}
