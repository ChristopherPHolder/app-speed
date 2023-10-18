import { Route } from '@angular/router';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { auditBuilderRoutes } from '../../../../libs/feature/audit-builder/src/lib/audit-builder.routes';

export const appRoutes: Route[] = [
  {
    path: 'audit-builder',
    loadComponent: () => import('@app-speed/feature/audit-builder').then(i => i.AuditBuilderComponent)
  },
  ...auditBuilderRoutes
];
