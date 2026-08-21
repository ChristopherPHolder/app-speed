import { FilmstripPageComponent } from './filmstrip-page.component';
import { ScreenshotExtractorPageComponent } from './screenshot-extractor-page.component';
import { TraceToolsCatalogPageComponent } from './trace-tools-catalog-page.component';
import { traceConvenienceRoutes } from './trace-convenience.routes';

describe('traceConvenienceRoutes', () => {
  it('mounts the screenshot extractor', () => {
    expect(traceConvenienceRoutes[0]).toMatchObject({
      path: 'screenshots',
      component: ScreenshotExtractorPageComponent,
      title: 'Extract trace screenshots',
    });
  });
  it('mounts the filmstrip and trace catalogue with accessible titles', () => {
    expect(traceConvenienceRoutes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'filmstrip',
          component: FilmstripPageComponent,
          title: 'Generate a trace filmstrip',
        }),
        expect.objectContaining({ path: '', component: TraceToolsCatalogPageComponent, title: 'Trace tools' }),
      ]),
    );
  });
});
