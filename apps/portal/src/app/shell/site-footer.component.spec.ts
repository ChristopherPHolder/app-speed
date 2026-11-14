import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyticsConsentService, ANALYTICS_ENABLED } from '../analytics/analytics-consent.service';
import { operator } from '../legal/operator';
import { SiteFooterComponent } from './site-footer.component';

describe('SiteFooterComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ANALYTICS_ENABLED, useValue: false }],
    });
  });

  afterEach(() => localStorage.clear());

  it('links to every legal page and the contact address', async () => {
    const fixture = TestBed.createComponent(SiteFooterComponent);
    await fixture.whenStable();
    const navigation = (fixture.nativeElement as HTMLElement).querySelector('nav[aria-label="Legal"]');
    const links = Array.from(navigation?.querySelectorAll('a') ?? [], (link) => [
      link.textContent?.trim(),
      link.getAttribute('href'),
    ]);
    expect(links).toEqual([
      ['Legal notice', '/legal-notice'],
      ['Privacy policy', '/privacy'],
      ['Terms of service', '/terms'],
      ['Contact', `mailto:${operator.email}`],
    ]);
  });

  it('reopens the consent settings so a choice can be changed or withdrawn', async () => {
    const consent = TestBed.inject(AnalyticsConsentService);
    consent.choose('accepted');
    const fixture = TestBed.createComponent(SiteFooterComponent);
    await fixture.whenStable();
    const button = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
      (item) => item.textContent?.trim() === 'Cookie settings',
    );
    expect(button?.type).toBe('button');
    button?.click();
    expect(consent.settingsOpen()).toBe(true);
  });
});
