import { Component, ViewEncapsulation } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NxWelcomeComponent } from './nx-welcome.component';

@Component({
  standalone: true,
  imports: [NxWelcomeComponent, RouterModule],
  selector: 'app-root',
  template: `<app-nx-welcome></app-nx-welcome> <router-outlet></router-outlet>`,
  styles: [''],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
  title = 'audit-manager';
}
