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
            loadComponent: () => import('@app-speed/feature/user-flow'),
          },
          {
            path: 'viewer',
            loadComponent: () => import('@app-speed/feature/viewer'),
          },
        ],
      },
      { path: '', redirectTo: 'user-flow', pathMatch: 'full' },
      { path: '**', redirectTo: 'results-viewer' },
    ],
  },
];
