import { Routes } from '@angular/router';
import { ScreenshotExtractorPageComponent } from './screenshot-extractor-page.component';

export const traceConvenienceRoutes: Routes = [
  { path: 'screenshots', component: ScreenshotExtractorPageComponent, title: 'Extract trace screenshots' },
  { path: '', redirectTo: 'screenshots', pathMatch: 'full' },
];
