import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ShellComponent } from 'ui/shell';

@Component({
  standalone: true,
  imports: [ShellComponent, RouterModule],
  selector: 'app-root',
  template: `<ui-shell [navItems]='navItems'><router-outlet/></ui-shell>`,
  styles: [''],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'audit-manager';

  public readonly navItems = [
    'Link 1',
    'Link 2',
    'Link 3'
  ]
}
