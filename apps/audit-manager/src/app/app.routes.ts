import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'audit-builder',
    loadComponent: () => import('@app-speed/feature/audit-builder').then(i => i.AuditBuilderComponent)
  },
];
