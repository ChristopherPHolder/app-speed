import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'audit-builder',
    loadComponent: () => import('@app-speed/feature/audit-builder').then(c => c.AuditBuilderContainer),
  },
  {
    path: 'results-viewer',
    loadComponent: () => import('@app-speed/feature/audit-viewer').then(c => c.AuditViewerContainer),
  },
  { path: '',   redirectTo: 'results-viewer', pathMatch: 'full' },
  { path: '**',   redirectTo: 'results-viewer' },
];
