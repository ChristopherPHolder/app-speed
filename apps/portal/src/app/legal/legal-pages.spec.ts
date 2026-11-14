import { TestBed } from '@angular/core/testing';
import { provideRouter, Route, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AnalyticsConsentService, ANALYTICS_ENABLED } from '../analytics/analytics-consent.service';
import { shellRoutes } from '../shell/shell.routes';
import { operator } from './operator';

const legalPaths = new Set(['legal-notice', 'impressum', 'privacy', 'terms']);
const legalRoutes: Route[] = (shellRoutes[0].children ?? []).filter((route) => legalPaths.has(route.path ?? ''));

describe('Legal pages', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(legalRoutes), { provide: ANALYTICS_ENABLED, useValue: false }],
    });
  });

  afterEach(() => localStorage.clear());

  const open = async (url: string) => {
    const harness = await RouterTestingHarness.create(url);
    return { harness, element: harness.routeNativeElement as HTMLElement };
  };

  it('publishes the operator details in the legal notice', async () => {
    const { element } = await open('/legal-notice');
    const text = element.textContent ?? '';
    expect(element.querySelector('h1')?.textContent).toContain('Legal notice');
    for (const detail of [operator.name, operator.street, operator.vatId, operator.tradeAuthority, operator.chamber]) {
      expect(text).toContain(detail);
    }
    expect(element.querySelector(`a[href="mailto:${operator.email}"]`)).not.toBeNull();
  });

  it('redirects the German Impressum path to the legal notice', async () => {
    await open('/impressum');
    expect(TestBed.inject(Router).url).toBe('/legal-notice');
  });

  it.each([
    ['/privacy', 'Privacy policy'],
    ['/terms', 'Terms of service'],
  ])('serves %s without signing in or consenting', async (url, heading) => {
    const { element } = await open(url);
    expect(TestBed.inject(AnalyticsConsentService).choice()).toBeNull();
    expect(element.querySelector('h1')?.textContent).toContain(heading);
    expect(element.textContent).toContain(operator.name);
  });

  it('discloses analytics cookies and reopens consent settings from the privacy policy', async () => {
    const consent = TestBed.inject(AnalyticsConsentService);
    consent.choose('rejected');
    const { harness, element } = await open('/privacy');
    expect(element.textContent).toContain('_ga_W51NXLKGXB');
    expect(element.textContent).toContain('Datenschutzbehörde');
    const button = Array.from(element.querySelectorAll('button')).find((item) =>
      item.textContent?.includes('Change cookie settings'),
    );
    button?.click();
    harness.detectChanges();
    expect(consent.settingsOpen()).toBe(true);
  });
});
