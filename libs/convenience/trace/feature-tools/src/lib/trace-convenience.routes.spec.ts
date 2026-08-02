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
});
