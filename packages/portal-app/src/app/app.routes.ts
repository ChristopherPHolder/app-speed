import { Route } from '@angular/router';

export const appRoutes: Route[] = [
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
];
