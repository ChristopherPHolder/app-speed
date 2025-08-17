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
            loadChildren: () => import('@app-speed/portal-feature-audit').then((m) => m.auditRoutes),
          },
          {
            path: 'flow',
            loadComponent: () => import('@app-speed/portal-feature-audit'),
          },
          {
            path: 'builder',
            loadComponent: () => import('@app-speed/portal-feature-audit/builder'),
          },
          {
            path: 'viewer',
            loadComponent: () => import('@app-speed/portal-feature-audit/viewer'),
          },
          // { path: '', redirectTo: 'builder', pathMatch: 'full' },
        ],
      },
      { path: '', redirectTo: 'user-flow', pathMatch: 'full' },
      { path: '**', redirectTo: 'results-viewer' },
    ],
  },
];
