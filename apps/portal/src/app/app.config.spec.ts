import { appConfig } from './app.config';
import { shellRoutes } from './shell/shell.routes';

describe('appConfig', () => {
  it('should provide app-level providers', () => {
    expect(appConfig.providers?.length ?? 0).toBeGreaterThan(0);
  });
});

describe('shell audit routes', () => {
  const auditRoutes = shellRoutes[0]?.children?.find((route) => route.path === 'audits')?.children ?? [];

  it('mounts combined and fixed user-flow history before the user-flow feature', () => {
    expect(auditRoutes.map((route) => route.path)).toEqual(['history', 'user-flow/history', 'user-flow', '']);
    expect(auditRoutes[0]?.data?.['auditHistory'].endpoint).toBe('/api/audits/history');
    expect(auditRoutes[1]?.data?.['auditHistory'].endpoint).toBe('/api/audits/user-flow/history');
  });

  it('redirects the audits root to combined history', () => {
    expect(auditRoutes.at(-1)).toMatchObject({ path: '', redirectTo: 'history', pathMatch: 'full' });
  });
});

describe('shell convenience routes', () => {
  it('mounts trace tools before the convenience catalogue', () => {
    const convenienceRoute = shellRoutes[0]?.children?.find((route) => route.path === 'convenience');

    expect(convenienceRoute?.children?.map((route) => route.path)).toEqual(['trace', '']);
    expect(convenienceRoute?.children?.every((route) => typeof route.loadChildren === 'function')).toBe(true);
  });
});

describe('shell landing route', () => {
  it('renders the landing page at the app root without redirecting', () => {
    const landingRoute = shellRoutes[0]?.children?.find((route) => route.path === '');

    expect(landingRoute).toMatchObject({ path: '', pathMatch: 'full', title: 'App Speed' });
    expect(landingRoute?.component).toBeDefined();
    expect(landingRoute?.redirectTo).toBeUndefined();
  });
});
