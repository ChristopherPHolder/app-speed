import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, InjectionToken, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';

const measurementId = 'G-W51NXLKGXB';
const storageKey = 'app-speed.analytics-consent.v1';
const lifetime = 180 * 24 * 60 * 60 * 1000;
type Choice = 'accepted' | 'rejected';

declare global {
  interface Window {
    dataLayer?: IArguments[];
    gtag?: (...args: unknown[]) => void;
    'ga-disable-G-W51NXLKGXB'?: boolean;
  }
}

export const ANALYTICS_ENABLED = new InjectionToken<boolean>('Analytics enabled', {
  providedIn: 'root',
  factory: () => inject(DOCUMENT).location?.hostname === 'appspeed.dev',
});

export const RELOAD_AFTER_ANALYTICS_WITHDRAWAL = new InjectionToken<() => void>('Reload after analytics withdrawal', {
  providedIn: 'root',
  factory: () => {
    const window = inject(DOCUMENT).defaultView;
    return () => window?.location.reload();
  },
});

@Injectable({ providedIn: 'root' })
export class AnalyticsConsentService {
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document.defaultView;
  private readonly router = inject(Router);
  private readonly enabled = inject(ANALYTICS_ENABLED);
  private readonly reload = inject(RELOAD_AFTER_ANALYTICS_WITHDRAWAL);
  private readonly choiceState = signal<Choice | null>(this.readChoice());
  readonly choice = this.choiceState.asReadonly();
  readonly settingsOpen = signal(this.choice() === null);
  private started = false;

  constructor() {
    if (this.choice() === 'accepted') this.start();
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) this.pageView();
    });
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) {
        const choice = this.readChoice();
        this.choiceState.set(choice);
        this.settingsOpen.set(choice === null);
        if (choice === 'accepted') this.start();
        else this.stop();
      }
    };
    this.window?.addEventListener('storage', onStorage);
    inject(DestroyRef).onDestroy(() => this.window?.removeEventListener('storage', onStorage));
  }

  choose(choice: Choice): void {
    this.choiceState.set(choice);
    this.settingsOpen.set(false);
    try {
      this.window?.localStorage.setItem(storageKey, `${choice}:${Date.now() + lifetime}`);
    } catch {
      // Storage restrictions must not prevent a visitor from rejecting analytics.
    }
    if (choice === 'accepted') this.start();
    else this.stop();
  }

  private readChoice(): Choice | null {
    try {
      const [choice, expiry] = this.window?.localStorage.getItem(storageKey)?.split(':') ?? [];
      return (choice === 'accepted' || choice === 'rejected') && Number(expiry) > Date.now() ? choice : null;
    } catch {
      return null;
    }
  }

  private start(): void {
    const window = this.window;
    if (!this.enabled || !window || this.started) return;
    this.started = true;
    window['ga-disable-G-W51NXLKGXB'] = false;
    window.dataLayer = window.dataLayer || [];
    // Google's queue consumes Arguments objects rather than event arrays.
    window.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: this.pageLocation(),
      page_referrer: '',
      page_title: 'App Speed',
      cookie_domain: 'none',
      cookie_expires: lifetime / 1000,
    });
    const script = this.document.createElement('script');
    script.id = 'app-speed-google-analytics';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    this.document.head.appendChild(script);
    if (this.router.navigated) this.pageView();
  }

  private pageLocation(): string {
    // Route definitions retain placeholders, excluding IDs, query strings and fragments.
    const paths: string[] = [];
    let route = this.router.routerState.snapshot.root.firstChild;
    while (route) {
      if (route.routeConfig?.path) paths.push(route.routeConfig.path);
      route = route.firstChild;
    }
    return `${this.document.location.origin}/${paths.join('/')}`;
  }

  private pageView(): void {
    if (!this.started || this.choice() !== 'accepted') return;
    const parameters = { page_location: this.pageLocation(), page_referrer: '', page_title: 'App Speed' };
    this.window?.gtag?.('set', parameters);
    this.window?.gtag?.('event', 'page_view', { ...parameters, send_to: measurementId });
  }

  private stop(): void {
    if (!this.window) return;
    this.window['ga-disable-G-W51NXLKGXB'] = true;
    for (const cookie of this.document.cookie.split(';')) {
      const name = cookie.trim().split('=')[0];
      if (name === '_ga' || name.startsWith('_ga_')) {
        this.document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
      }
    }
    // Unload Google's runtime, including automatic event listeners and queued work.
    if (this.started) {
      this.window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
      this.reload();
    }
  }
}
