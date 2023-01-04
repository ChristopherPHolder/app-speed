import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadChildren: () =>
      import('features/simple-audit')
        .then(m => m.simpleAuditRoutes)
  },
  {
    path: 'view/:id',
    loadChildren: () =>
      import('features/result-viewer')
        .then(m => m.featuresResultViewerRoutes)
  }
];
