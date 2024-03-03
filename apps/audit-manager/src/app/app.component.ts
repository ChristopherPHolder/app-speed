import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ShellComponent } from 'ui/shell';

@Component({
  standalone: true,
  imports: [ShellComponent, RouterModule],
  selector: 'app-root',
  template: `
    <ui-shell 
      [navItems]='navItems'
      (navClick)='navigateTo($event)'
    >
      <router-outlet/>
    </ui-shell>`,
  styles: [''],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  router = inject(Router);
  title = 'audit-manager';

  public readonly navItems = [
    'results-viewer',
    'audit-builder',
  ]
  navigateTo(location: string): void {
    this.router.navigate([location]);
  }
}
