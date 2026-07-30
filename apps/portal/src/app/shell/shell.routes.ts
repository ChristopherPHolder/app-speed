import { Route } from '@angular/router';
import { ShellComponent } from './shell.component';

export const shellRoutes: Route[] = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: 'audits',
        children: [
          {
            path: 'user-flow',
            loadChildren: () => import('@app-speed/audit/user-flow/feature-builder').then((m) => m.auditBuilderRoutes),
          },
        ],
      },
      { path: '', redirectTo: 'audits/user-flow', pathMatch: 'full' },
      { path: '**', redirectTo: 'results-viewer' },
    ],
  },
];
