import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'audit-builder',
    loadComponent: () => import('@app-speed/feature/audit-builder').then(c => c.AuditBuilderContainer),
  },
  { path: '',   redirectTo: 'audit-builder', pathMatch: 'full' },
  { path: '**',   redirectTo: 'audit-builder' },
];
