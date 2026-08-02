import { Routes } from '@angular/router';
import { ConvenienceCatalogPageComponent } from './convenience-catalog-page.component';

export const convenienceCatalogRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: ConvenienceCatalogPageComponent,
    title: 'Convenience tools',
  },
];
