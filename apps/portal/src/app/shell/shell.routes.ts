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
            path: '',
            loadChildren: () => import('@app-speed/audit/portal/builder').then((m) => m.auditBuilderRoutes),
          },
          {
            path: 'builder',
            redirectTo: '',
            pathMatch: 'full',
          },
        ],
      },
      {
        path: 'audit-runs',
        loadChildren: () => import('@app-speed/audit/portal/runs').then((m) => m.auditRunsRoutes),
      },
      { path: '', redirectTo: 'user-flow', pathMatch: 'full' },
      { path: '**', redirectTo: 'results-viewer' },
    ],
  },
];
