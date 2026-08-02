import { ConvenienceCatalogPageComponent } from './convenience-catalog-page.component';
import { convenienceCatalogRoutes } from './convenience-catalog.routes';

describe('convenienceCatalogRoutes', () => {
  it('mounts the catalogue at the feature root', () => {
    expect(convenienceCatalogRoutes).toEqual([
      expect.objectContaining({
        path: '',
        pathMatch: 'full',
        component: ConvenienceCatalogPageComponent,
        title: 'Convenience tools',
      }),
    ]);
  });
});
