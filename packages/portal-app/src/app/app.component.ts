import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShellComponent } from '@app-speed/ui/shell';

@Component({
  standalone: true,
  imports: [ShellComponent, RouterOutlet],
  selector: 'app-root',
  template: `<ui-shell><router-outlet/></ui-shell>`,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
