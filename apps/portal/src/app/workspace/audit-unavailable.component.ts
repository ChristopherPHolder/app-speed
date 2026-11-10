import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-audit-unavailable',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section role="alert">
      <h1>Audit unavailable</h1>
      <p>The project could not be loaded. It may no longer exist, or you may not have access.</p>
      <p>Try opening the audit link again, or choose a project you can access.</p>
      <a routerLink="/workspaces">Go to workspaces</a>
    </section>
  `,
  styles: `
    :host {
      display: block;
      padding: 24px;
    }
  `,
})
export class AuditUnavailableComponent {}
