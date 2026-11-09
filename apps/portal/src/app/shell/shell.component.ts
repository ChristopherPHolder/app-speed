import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { MatToolbar } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AccountMenuComponent } from '../auth/account-menu.component';
import { PortalAuthService } from '../auth/portal-auth.service';
import { WorkspaceState } from '../workspace/workspace-state.service';
import { WorkspaceNavigationComponent } from '../workspace/workspace-navigation.component';

const desktopQuery = '(width >= 960px)';

@Component({
  selector: 'app-shell',
  imports: [
    MatButton,
    MatIcon,
    MatIconButton,
    MatSidenav,
    MatSidenavContainer,
    MatSidenavContent,
    MatToolbar,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    AccountMenuComponent,
    WorkspaceNavigationComponent,
  ],
  template: `
    <a class="skip-link" href="#main-content">Skip to content</a>
    <mat-sidenav-container [class.mobile-drawer-open]="!desktop() && mobileMenuOpen()">
      <mat-sidenav
        id="mobile-navigation"
        aria-label="Navigation"
        [mode]="desktop() ? 'side' : 'over'"
        fixedInViewport
        [opened]="drawerOpen()"
        (openedChange)="syncMobileMenu($event)"
        [autoFocus]="!desktop()"
      >
        @if (!desktop()) {
          <div class="drawer-heading">
            <img src="assets/logo-wordmark.svg" alt="App Speed" />
            <button mat-icon-button type="button" aria-label="Close navigation menu" (click)="closeMobileMenu()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        }
        @if (auth.signedIn()) {
          @defer (when auth.signedIn()) {
            <app-workspace-navigation [showAccount]="desktop()" (navigate)="closeMobileMenu()" />
          }
        } @else {
          <nav class="guest-drawer-links" aria-label="Mobile navigation">
            <a mat-button routerLink="/" (click)="closeMobileMenu()"><mat-icon>home</mat-icon>Home</a>
            @for (item of navigationItems; track item.route) {
              <a
                mat-button
                [routerLink]="item.route"
                [queryParams]="
                  item.route.startsWith('/audits') && workspaceState.project()
                    ? { projectId: workspaceState.projectId() }
                    : {}
                "
                routerLinkActive="active-navigation-item"
                [routerLinkActiveOptions]="{ exact: item.exact }"
                ariaCurrentWhenActive="page"
                (click)="closeMobileMenu()"
              >
                <mat-icon>{{ item.icon }}</mat-icon
                >{{ item.label }}
              </a>
            }
            <a
              mat-button
              href="https://github.com/ChristopherPHolder/app-speed"
              target="_blank"
              rel="noopener noreferrer"
              (click)="closeMobileMenu()"
            >
              <img class="github-icon" src="assets/GitHub_Invertocat_Black.svg" alt="" /> View on GitHub
            </a>
          </nav>
        }
      </mat-sidenav>
      <mat-sidenav-content class="shell-content" [class.workspace-shell]="auth.signedIn() && !onboarding()">
        <header class="app-header">
          <mat-toolbar>
            <div class="toolbar-content">
              @if (!desktop()) {
                <button
                  mat-icon-button
                  type="button"
                  aria-controls="mobile-navigation"
                  [attr.aria-expanded]="mobileMenuOpen()"
                  aria-label="Open navigation menu"
                  (click)="mobileMenuOpen.set(true)"
                >
                  <mat-icon>menu</mat-icon>
                </button>
              }
              <a class="brand" routerLink="/" aria-label="App Speed home">
                <picture
                  ><source media="(width < 960px)" srcset="assets/logo-wordmark.svg" />
                  <img src="assets/logo.svg" alt=""
                /></picture>
              </a>
              @if (!auth.signedIn() && desktop()) {
                <nav class="desktop-navigation" aria-label="Primary navigation">
                  @for (item of navigationItems; track item.route) {
                    <a
                      mat-button
                      [routerLink]="item.route"
                      [queryParams]="
                        item.route.startsWith('/audits') && workspaceState.project()
                          ? { projectId: workspaceState.projectId() }
                          : {}
                      "
                      routerLinkActive="active-navigation-item"
                      [routerLinkActiveOptions]="{ exact: item.exact }"
                      ariaCurrentWhenActive="page"
                      >{{ item.label }}</a
                    >
                  }
                </nav>
              }
              <div class="toolbar-actions">
                @if (auth.signedIn()) {
                  @if (!desktop() || onboarding()) {
                    @defer (when auth.signedIn()) {
                      <app-account-menu />
                    }
                  }
                } @else {
                  <button
                    matButton="outlined"
                    type="button"
                    [disabled]="auth.availability() === 'loading'"
                    (click)="signIn()"
                  >
                    Sign in
                  </button>
                  @if (desktop()) {
                    <a
                      mat-icon-button
                      href="https://github.com/ChristopherPHolder/app-speed"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open the app-speed repository on GitHub"
                      ><img class="github-icon" src="assets/GitHub_Invertocat_Black.svg" alt=""
                    /></a>
                  }
                }
              </div>
            </div>
          </mat-toolbar>
          @if (showAuthError()) {
            <p class="auth-error" role="status">Sign-in is unavailable right now. You can still use the audit tools.</p>
          }
        </header>
        <main id="main-content" tabindex="-1"><router-outlet /></main>
        <footer>
          <span
            >Made with ❤️ by
            <a target="_blank" rel="noopener noreferrer" href="https://x.com/chrispholder">Chris</a></span
          >
        </footer>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100dvh;
    }
    .shell-content {
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
    }
    mat-sidenav {
      width: min(280px, calc(100% - 48px));
      background: var(--mat-sys-surface-container-low);
    }
    .drawer-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 8px 12px;
    }
    .drawer-heading img {
      height: 40px;
    }
    .guest-drawer-links {
      display: grid;
      gap: 4px;
      padding: 8px 12px;
    }
    .guest-drawer-links a {
      justify-content: flex-start;
      min-height: 48px;
    }
    .app-header {
      position: sticky;
      top: 0;
      z-index: 2;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
    }
    mat-toolbar {
      height: 72px;
      padding: 0;
      background: transparent;
    }
    .toolbar-content {
      display: flex;
      width: min(100% - 48px, 1120px);
      height: 100%;
      margin: 0 auto;
      align-items: center;
      gap: 24px;
    }
    .workspace-shell .toolbar-content {
      width: calc(100% - 32px);
    }
    .brand {
      display: inline-flex;
      flex: 0 0 auto;
      border-radius: 8px;
      align-items: center;
    }
    .brand img {
      display: block;
      height: 56px;
      width: auto;
    }
    .desktop-navigation {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .desktop-navigation a {
      color: var(--mat-sys-on-surface-variant);
    }
    .active-navigation-item {
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-inline-start: auto;
    }
    .github-icon {
      width: 24px;
      height: 24px;
      vertical-align: middle;
    }
    .auth-error {
      margin: 0;
      padding: 8px 16px;
      text-align: center;
      color: var(--mat-sys-error);
    }
    main {
      flex: 1 0 auto;
      min-width: 0;
      outline: none;
    }
    footer {
      border-top: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-low);
      padding: 16px;
      text-align: center;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
    footer a {
      color: inherit;
    }
    .skip-link {
      position: fixed;
      inset: 8px auto auto 8px;
      z-index: 1000;
      padding: 8px 12px;
      border-radius: 8px;
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      transform: translateY(-150%);
    }
    .skip-link:focus {
      transform: translateY(0);
    }
    @media (width >= 960px) {
      .workspace-shell .app-header {
        display: none;
      }
    }
    @media (width < 960px) {
      mat-toolbar {
        height: 64px;
      }
      .toolbar-content,
      .workspace-shell .toolbar-content {
        width: calc(100% - 8px);
        gap: 4px;
      }
      .brand img {
        height: 44px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  protected readonly workspaceState = inject(WorkspaceState);
  protected readonly auth = inject(PortalAuthService);
  private readonly router = inject(Router);
  private readonly breakpoint = inject(BreakpointObserver);
  protected readonly desktop = toSignal(this.breakpoint.observe(desktopQuery).pipe(map((result) => result.matches)), {
    initialValue: this.breakpoint.isMatched(desktopQuery),
  });
  protected readonly onboarding = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.split('?')[0] === '/workspaces/join'),
    ),
    { initialValue: false },
  );
  protected readonly mobileMenuOpen = signal(false);
  protected readonly showAuthError = signal(false);
  protected readonly drawerOpen = computed(() =>
    this.desktop() ? this.auth.signedIn() && !this.onboarding() : this.mobileMenuOpen(),
  );
  protected readonly navigationItems = [
    { label: 'Run audit', route: '/audits/user-flow', icon: 'speed', exact: true },
    { label: 'Audit history', route: '/audits/history', icon: 'history', exact: true },
    { label: 'Trace tools', route: '/convenience', icon: 'construction', exact: false },
  ];
  constructor() {
    effect(() => {
      if (this.desktop()) this.closeMobileMenu();
    });
  }
  protected syncMobileMenu(open: boolean): void {
    if (!this.desktop()) this.mobileMenuOpen.set(open);
  }
  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
  protected signIn(): void {
    this.closeMobileMenu();
    if (this.auth.availability() === 'ready') this.auth.openSignIn();
    else this.showAuthError.set(true);
  }
}
