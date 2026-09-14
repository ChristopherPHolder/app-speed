import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import {
  ANALYTICS_ENABLED,
  AnalyticsConsentService,
  RELOAD_AFTER_ANALYTICS_WITHDRAWAL,
} from './analytics-consent.service';
import { ConsentBannerComponent } from './consent-banner.component';

@Component({ template: '' })
class TestPage {}

const key = 'app-speed.analytics-consent.v1';
const commands = () => window.dataLayer?.map((command) => Array.from(command)) ?? [];

describe('Analytics consent', () => {
  const reload = vi.fn();
  beforeEach(() => {
    reload.mockClear();
    localStorage.clear();
    delete window.dataLayer;
    delete window.gtag;
    delete window['ga-disable-G-W51NXLKGXB'];
    document.getElementById('app-speed-google-analytics')?.remove();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'audits/:id', component: TestPage },
          { path: '', component: TestPage },
        ]),
        { provide: ANALYTICS_ENABLED, useValue: true },
        { provide: RELOAD_AFTER_ANALYTICS_WITHDRAWAL, useValue: reload },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    document.getElementById('app-speed-google-analytics')?.remove();
    delete window.dataLayer;
    delete window.gtag;
    delete window['ga-disable-G-W51NXLKGXB'];
  });

  it('makes no Google requests or commands before consent or after rejection', async () => {
    const service = TestBed.inject(AnalyticsConsentService);
    await TestBed.inject(Router).navigateByUrl('/');
    expect(service.settingsOpen()).toBe(true);
    expect(window.gtag).toBeUndefined();
    service.choose('rejected');
    await TestBed.inject(Router).navigateByUrl('/audits/private-id');
    expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull();
    expect(commands()).toEqual([]);
    expect(localStorage.getItem(key)).toMatch(/^rejected:/);
  });

  it('loads once after acceptance and sends sanitized page views on navigation', async () => {
    const service = TestBed.inject(AnalyticsConsentService);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/');
    service.choose('accepted');
    service.choose('accepted');
    await router.navigateByUrl('/audits/private-id?token=secret#private');
    expect(document.querySelectorAll('script[src*="googletagmanager"]')).toHaveLength(1);
    const events = commands().filter((command) => command[0] === 'event');
    expect(events).toHaveLength(2);
    expect(events[1]).toEqual([
      'event',
      'page_view',
      expect.objectContaining({
        page_location: `${location.origin}/audits/:id`,
        page_referrer: '',
      }),
    ]);
    expect(JSON.stringify(commands())).not.toMatch(/private-id|secret|token=/);
    expect(commands()[0]).toEqual([
      'consent',
      'default',
      expect.objectContaining({
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      }),
    ]);
  });

  it.each(['accepted', 'rejected'])('restores a saved %s choice', (choice) => {
    localStorage.setItem(key, `${choice}:${Date.now() + 60_000}`);
    const service = TestBed.inject(AnalyticsConsentService);
    expect(service.choice()).toBe(choice);
    expect(service.settingsOpen()).toBe(false);
    expect(Boolean(window.gtag)).toBe(choice === 'accepted');
  });

  it.each(['accepted:0', 'garbage', 'accepted:invalid'])('ignores expired or malformed choice %s', (value) => {
    localStorage.setItem(key, value);
    expect(TestBed.inject(AnalyticsConsentService).choice()).toBeNull();
    expect(window.gtag).toBeUndefined();
  });

  it('works when browser storage is unavailable', () => {
    const read = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const service = TestBed.inject(AnalyticsConsentService);
    service.choose('rejected');
    expect(service.choice()).toBe('rejected');
    expect(window.gtag).toBeUndefined();
    read.mockRestore();
    write.mockRestore();
  });

  it('does not enable collection outside production', () => {
    TestBed.overrideProvider(ANALYTICS_ENABLED, { useValue: false });
    TestBed.inject(AnalyticsConsentService).choose('accepted');
    expect(window.gtag).toBeUndefined();
  });

  it('disables collection and clears analytics cookies on withdrawal, even while the script is loading', async () => {
    const service = TestBed.inject(AnalyticsConsentService);
    service.choose('accepted');
    document.cookie = '_ga=test; Path=/';
    document.cookie = '_ga_W51NXLKGXB=test; Path=/';
    document.cookie = 'necessary=keep; Path=/';
    service.choose('rejected');
    expect(window['ga-disable-G-W51NXLKGXB']).toBe(true);
    expect(document.cookie).not.toContain('_ga');
    expect(document.cookie).toContain('necessary=keep');
    expect(reload).toHaveBeenCalledOnce();
    expect(commands().at(-1)).toEqual(['consent', 'update', { analytics_storage: 'denied' }]);
    await TestBed.inject(Router).navigateByUrl('/');
    expect(commands().filter((command) => command[0] === 'event')).toEqual([]);
    document.cookie = 'necessary=; Max-Age=0; Path=/';
  });

  it('honors withdrawal from another tab', () => {
    const service = TestBed.inject(AnalyticsConsentService);
    service.choose('accepted');
    localStorage.setItem(key, `rejected:${Date.now() + 60_000}`);
    window.dispatchEvent(new StorageEvent('storage', { key }));
    expect(service.choice()).toBe('rejected');
    expect(window['ga-disable-G-W51NXLKGXB']).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('offers reject, accept and reopening settings through the UI', async () => {
    const fixture = TestBed.createComponent(ConsentBannerComponent);
    await fixture.whenStable();
    const element: HTMLElement = fixture.debugElement.nativeElement;
    const button = (label: string) =>
      Array.from(element.querySelectorAll('button')).find((item) => item.textContent?.trim() === label);
    expect(button('Accept analytics')).toBeDefined();
    button('Reject analytics')?.click();
    await fixture.whenStable();
    expect(element.querySelector('section')).toBeNull();
    button('Cookie settings')?.click();
    await fixture.whenStable();
    expect(element.querySelector('section')).not.toBeNull();
  });
});
