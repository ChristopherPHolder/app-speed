import { Route } from '@angular/router';
import { ShellComponent } from './shell.component';

export const shellRoutes: Route[] = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: 'user-flow',
        children: [
          {
            path: 'builder',
            loadChildren: () => import('@app-speed/audit/portal-feature').then((m) => m.auditRoutes),
          },
          {
            path: 'viewer',
            loadComponent: () => import('@app-speed/audit/portal-feature').then((m) => m.AuditViewerContainer),
          },
          { path: '', redirectTo: 'builder', pathMatch: 'full' },
        ],
      },
      {
        path: 'audit-runs',
        loadChildren: () => import('@app-speed/audit/portal-feature-runs').then((m) => m.auditRunsRoutes),
      },
      { path: '', redirectTo: 'user-flow', pathMatch: 'full' },
      { path: '**', redirectTo: 'results-viewer' },
    ],
  },
];
