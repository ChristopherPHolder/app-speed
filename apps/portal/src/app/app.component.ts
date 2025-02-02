import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  template: `<router-outlet />`,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  http = inject(HttpClient);

  put = () => this.http.put('api/conductor/auditComplete', { id: 1 });

  constructor() {
    this.http.put('api/conductor/auditComplete', { id: 1 }).subscribe((e) => {
      console.log('Audit Complete', e);
    });
  }
}
