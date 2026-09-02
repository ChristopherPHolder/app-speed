import { Routes } from '@angular/router';
import { FilmstripPageComponent } from './filmstrip-page.component';
import { FilmstripComparisonPageComponent } from './filmstrip-comparison-page.component';
import { ScreenshotExtractorPageComponent } from './screenshot-extractor-page.component';

export const traceConvenienceRoutes: Routes = [
  { path: 'screenshots', component: ScreenshotExtractorPageComponent, title: 'Extract trace screenshots' },
  {
    path: 'filmstrip/compare',
    component: FilmstripComparisonPageComponent,
    title: 'Compare trace filmstrips',
  },
  { path: 'filmstrip', component: FilmstripPageComponent, title: 'Generate a trace filmstrip' },
  { path: '', redirectTo: '/convenience', pathMatch: 'full' },
];
