import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'audit',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AuditComponent {}
