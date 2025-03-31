import { Route } from '@angular/router';
import { ShellComponent } from './shell.component';
import { AuditBuilderComponent } from '@app-speed/portal-ui/audit-builder';

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
            loadComponent: () => import('@app-speed/portal-feature-audit'),
          },
          { path: 'builder', component: AuditBuilderComponent },
          {
            path: 'viewer',
            loadComponent: () => import('@app-speed/portal-feature-audit/viewer'),
          },
        ],
      },
      { path: '', redirectTo: 'user-flow', pathMatch: 'full' },
      { path: '**', redirectTo: 'results-viewer' },
    ],
  },
];
