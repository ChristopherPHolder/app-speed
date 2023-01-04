import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'view/:id',
    loadChildren: () =>
      import('features/result-viewer')
        .then(m => m.featuresResultViewerRoutes)
  }
];
