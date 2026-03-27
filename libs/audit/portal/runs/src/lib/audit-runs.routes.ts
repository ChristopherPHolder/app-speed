import { Route } from '@angular/router';
import { AuditRunDetailsPageComponent } from './audit-run-details-page.component';
import { AuditRunsPageComponent } from './audit-runs-page.component';

export const auditRunsRoutes: Route[] = [
  {
    path: '',
    component: AuditRunsPageComponent,
  },
  {
    path: ':id',
    component: AuditRunDetailsPageComponent,
  },
];
