import { FilmstripPageComponent } from './filmstrip-page.component';
import { FilmstripComparisonPageComponent } from './filmstrip-comparison-page.component';
import { ScreenshotExtractorPageComponent } from './screenshot-extractor-page.component';
import { traceConvenienceRoutes } from './trace-convenience.routes';

describe('traceConvenienceRoutes', () => {
  it('mounts the screenshot extractor', () => {
    expect(traceConvenienceRoutes[0]).toMatchObject({
      path: 'screenshots',
      component: ScreenshotExtractorPageComponent,
      title: 'Extract trace screenshots',
    });
  });
  it('mounts both filmstrip tools and redirects the old catalogue URL', () => {
    expect(traceConvenienceRoutes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'filmstrip/compare',
          component: FilmstripComparisonPageComponent,
          title: 'Compare trace filmstrips',
        }),
        expect.objectContaining({
          path: 'filmstrip',
          component: FilmstripPageComponent,
          title: 'Generate a trace filmstrip',
        }),
        expect.objectContaining({ path: '', redirectTo: '/convenience', pathMatch: 'full' }),
      ]),
    );
  });
});
