import { BreakpointObserver } from '@angular/cdk/layout';
import { of } from 'rxjs';
import { Component, signal } from '@angular/core';
import { DeferBlockState, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { WorkspaceState } from '../workspace/workspace-state.service';
import { PortalAuthService } from '../auth/portal-auth.service';
import { ShellComponent } from './shell.component';

@Component({
  template: '',
})
class TestRouteComponent {}

describe('ShellComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        {
          provide: BreakpointObserver,
          useValue: {
            isMatched: () => true,
            observe: () => of({ matches: true, breakpoints: {} }),
          },
        },
      ],
    }),
  );
  it('provides application landmarks and primary navigation', async () => {
    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([
          { path: 'audits/history', component: TestRouteComponent },
          { path: '**', component: TestRouteComponent },
        ]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ShellComponent);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/audits/history');
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const primaryNavigation = element.querySelector('nav[aria-label="Primary navigation"]');

    expect(element.querySelectorAll('header')).toHaveLength(1);
    expect(element.querySelectorAll('main')).toHaveLength(1);
    expect(element.querySelector('main')?.id).toBe('main-content');
    expect(element.querySelector('.skip-link')?.getAttribute('href')).toBe('#main-content');
    expect(element.querySelector('.brand')?.getAttribute('href')).toBe('/');
    expect(Array.from(primaryNavigation?.querySelectorAll('a') ?? [], (link) => link.textContent?.trim())).toEqual([
      'Run audit',
      'Audit history',
      'Trace tools',
    ]);
    expect(primaryNavigation?.querySelector('[aria-current="page"]')?.textContent).toContain('Audit history');
  });

  it('switches navigation with the Clerk session while keeping the current audit page mounted', async () => {
    const signedIn = signal(false);
    const accountImageUrl = signal('');
    const openSignIn = vi.fn();

    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([{ path: 'audits/history', component: TestRouteComponent }]),
        {
          provide: WorkspaceState,
          useValue: {
            error: signal(''),
            loading: signal(false),
            saving: signal(false),
            overview: signal(undefined),
            workspace: signal(undefined),
            workspaceId: signal(''),
            project: signal(undefined),
            projectId: signal(''),
            refresh: vi.fn(),
          },
        },
        {
          provide: PortalAuthService,
          useValue: {
            signedIn,
            availability: signal('ready'),
            openSignIn,
            accountLabel: signal('test@example.com'),
            accountImageUrl,
            signOut: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ShellComponent);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/audits/history');
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    const auditPage = element.querySelector('router-outlet + ng-component');
    expect(auditPage).not.toBeNull();
    const signIn = element.querySelector<HTMLButtonElement>('.toolbar-actions button');
    expect(signIn?.textContent?.trim()).toBe('Sign in');
    signIn?.click();
    expect(openSignIn).toHaveBeenCalledOnce();

    signedIn.set(true);
    await fixture.whenStable();
    const [accountMenu] = await fixture.getDeferBlocks();
    await accountMenu.render(DeferBlockState.Complete);
    await fixture.whenStable();
    expect(element.querySelector('mat-sidenav [aria-current="page"]')?.textContent).toContain('Audit history');
    expect(element.querySelector('[aria-label="Open the app-speed repository on GitHub"]')).toBeNull();
    expect(element.querySelector('[aria-label="Open account menu"]')).not.toBeNull();

    accountImageUrl.set('https://example.com/profile.jpg');
    await fixture.whenStable();
    const avatar = element.querySelector<HTMLImageElement>('[aria-label="Open account menu"] img');
    expect(avatar?.src).toBe('https://example.com/profile.jpg');
    avatar?.dispatchEvent(new Event('error'));
    await fixture.whenStable();
    expect(element.querySelector('[aria-label="Open account menu"] img')).toBeNull();
    expect(element.querySelector('[aria-label="Open account menu"] mat-icon')?.textContent).toBe('account_circle');

    signedIn.set(false);
    await fixture.whenStable();
    expect(element.querySelector('header [aria-current="page"]')?.textContent).toContain('Audit history');
    expect(element.querySelector('[aria-label="Open account menu"]')).toBeNull();
    expect(element.querySelector('router-outlet + ng-component')).toBe(auditPage);
    expect(router.url).toBe('/audits/history');
  });
});
