import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import ShellComponent from './shell/shell.component';

@Component({
  standalone: true,
  imports: [ShellComponent, RouterOutlet],
  selector: 'app-root',
  template: `
    <app-shell>
      <router-outlet />
    </app-shell>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AppComponent {}
