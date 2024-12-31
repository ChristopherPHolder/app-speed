import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConductorService } from '@app-speed/portal-data-access/conductor';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  template: ` <button (click)="conductor.scheduleAudit(' ')">Schedule</button> <router-outlet />`,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected conductor = inject(ConductorService);
}
