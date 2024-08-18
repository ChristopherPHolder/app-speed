import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'user-flow',
    loadComponent: () => import('@app-speed/feature/user-flow').then((c) => c.UserFlowComponent),
  },
  {
    path: 'audit-builder',
    loadComponent: () => import('@app-speed/feature/audit-builder').then((c) => c.AuditBuilderContainer),
  },
  {
    path: 'results-viewer',
    loadComponent: () => import('@app-speed/feature/audit-viewer').then((c) => c.AuditViewerContainer),
  },
  { path: '', redirectTo: 'user-flow', pathMatch: 'full' },
  { path: '**', redirectTo: 'results-viewer' },
];
