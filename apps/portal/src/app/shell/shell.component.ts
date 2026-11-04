import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface PrimaryNavigationItem {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
  readonly exact: boolean;
}

@Component({
  selector: 'app-shell',
  imports: [MatButton, MatIcon, MatIconButton, MatToolbar, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <a class="skip-link" href="#main-content">Skip to content</a>

    <div class="app-shell">
      <header class="app-header">
        <mat-toolbar>
          <div class="toolbar-content">
            <button
              class="mobile-menu-trigger"
              type="button"
              mat-icon-button
              aria-controls="mobile-navigation"
              aria-haspopup="dialog"
              [attr.aria-expanded]="mobileMenuOpen()"
              aria-label="Open navigation menu"
              (click)="openMobileNavigation($event)"
            >
              <mat-icon aria-hidden="true">menu</mat-icon>
            </button>

            <a class="brand" routerLink="/" aria-label="App Speed home">
              <picture>
                <source media="(width < 960px)" srcset="assets/logo-wordmark.svg" />
                <img src="assets/logo.svg" alt="" />
              </picture>
            </a>

            <nav class="desktop-navigation" aria-label="Primary navigation">
              @for (item of navigationItems; track item.route) {
                <a
                  mat-button
                  [routerLink]="item.route"
                  routerLinkActive="active-navigation-item"
                  [routerLinkActiveOptions]="{ exact: item.exact }"
                  ariaCurrentWhenActive="page"
                >
                  {{ item.label }}
                </a>
              }
            </nav>

            <div class="toolbar-actions">
              <a
                class="github-link"
                mat-icon-button
                href="https://github.com/ChristopherPHolder/app-speed"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open the app-speed repository on GitHub"
              >
                <img src="assets/GitHub_Invertocat_Black.svg" alt="" />
              </a>
            </div>
          </div>
        </mat-toolbar>
      </header>

      <!-- The backdrop is pointer-only. The close button and native Escape handle keyboard dismissal. -->
      <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
      <dialog
        #mobileNavigation
        id="mobile-navigation"
        class="mobile-navigation"
        aria-label="Navigation menu"
        (close)="mobileMenuOpen.set(false)"
        (click)="dismissFromBackdrop($event)"
      >
        <div class="mobile-navigation__toolbar">
          <button
            class="mobile-navigation__close"
            type="button"
            mat-icon-button
            autofocus
            aria-label="Close navigation menu"
            (click)="mobileNavigation.close()"
          >
            <mat-icon aria-hidden="true">menu_open</mat-icon>
          </button>
          <img class="mobile-navigation__brand" src="assets/logo-wordmark.svg" alt="" />
        </div>
        <nav class="mobile-navigation__links" aria-label="Mobile navigation">
          @for (item of mobileNavigationItems; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="active-navigation-item"
              [routerLinkActiveOptions]="{ exact: item.exact }"
              ariaCurrentWhenActive="page"
              (click)="mobileNavigation.close()"
            >
              <mat-icon aria-hidden="true">{{ item.icon }}</mat-icon>
              <span>{{ item.label }}</span>
            </a>
          }
          <a
            href="https://github.com/ChristopherPHolder/app-speed"
            target="_blank"
            rel="noopener noreferrer"
            (click)="mobileNavigation.close()"
          >
            <img class="mobile-navigation__github" src="assets/GitHub_Invertocat_Black.svg" alt="" />
            <span>View on GitHub</span>
            <mat-icon class="mobile-navigation__external" aria-hidden="true">open_in_new</mat-icon>
          </a>
        </nav>
      </dialog>

      <main id="main-content" tabindex="-1">
        <router-outlet />
      </main>

      <footer>
        <div class="footer-content">
          <span>
            Made with ❤️ by
            <a target="_blank" rel="noopener noreferrer" href="https://x.com/chrispholder">Chris</a>
          </span>
        </div>
      </footer>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100dvh;
    }

    .skip-link {
      position: fixed;
      top: 8px;
      left: 8px;
      z-index: 1000;
      padding: 10px 14px;
      border-radius: 10px;
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      text-decoration: none;
      transform: translateY(-150%);
    }

    .skip-link:focus {
      transform: translateY(0);
    }

    .app-shell {
      display: flex;
      min-height: 100dvh;
      flex-direction: column;
    }

    .app-header {
      position: sticky;
      top: 0;
      z-index: 20;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      background: rgb(255 255 255 / 94%);
      backdrop-filter: blur(14px);
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
      gap: 30px;
    }

    .brand {
      display: inline-flex;
      flex: 0 0 auto;
      border-radius: 8px;
      align-items: center;
      text-decoration: none;
    }

    .brand:focus-visible,
    .github-link:focus-visible {
      outline: 3px solid var(--mat-sys-primary);
      outline-offset: 3px;
    }

    .brand img {
      display: block;
      width: auto;
      height: 60px;
      aspect-ratio: 985.88983 / 686.3344;
    }

    .desktop-navigation {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .desktop-navigation a {
      min-height: 40px;
      border-radius: 9px;
      color: var(--mat-sys-on-surface-variant);
      font-weight: 600;
    }

    .desktop-navigation a.active-navigation-item {
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }

    .toolbar-actions {
      display: flex;
      margin-left: auto;
      align-items: center;
      gap: 4px;
    }

    .github-link img {
      display: block;
      width: 24px;
      height: 24px;
    }

    .github-link {
      color: var(--mat-sys-on-surface);
    }

    .mobile-menu-trigger {
      display: none;
    }

    .mobile-navigation {
      position: fixed;
      inset: 0 auto 0 0;
      inset-inline: 0 auto;
      box-sizing: border-box;
      width: min(320px, calc(100% - 48px));
      max-width: none;
      height: 100dvh;
      max-height: none;
      margin: 0;
      padding: 0;
      overflow: hidden;
      border: 0;
      background: var(--mat-sys-surface-container, #eef0f6);
      color: var(--mat-sys-on-surface, #1f1f1f);
      box-shadow: 0 0 12px rgb(0 0 0 / 18%);
    }

    .mobile-navigation[open] {
      display: grid;
      grid-template-rows: 64px minmax(0, 1fr);
    }

    .mobile-navigation::backdrop {
      background: linear-gradient(to bottom, transparent 64px, rgb(0 0 0 / 32%) 64px);
    }

    .mobile-navigation__toolbar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding-inline: 4px;
      background: var(--mat-sys-surface, #fff);
    }

    .mobile-navigation__brand {
      display: block;
      height: 44px;
    }

    .mobile-navigation__links {
      padding: 0 8px 16px;
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .mobile-navigation__links a {
      display: flex;
      min-height: 48px;
      padding: 0 16px;
      border-radius: 999px;
      align-items: center;
      gap: 16px;
      color: var(--mat-sys-on-surface-variant, #44474f);
      font: var(--mat-sys-label-large, 500 1rem/1.5rem Roboto, sans-serif);
      text-decoration: none;
    }

    .mobile-navigation__links a:hover {
      background: var(--mat-sys-surface-container-high, #e5e8f0);
    }

    .mobile-navigation__links a.active-navigation-item {
      background: var(--mat-sys-secondary-container, #d7e3ff);
      color: var(--mat-sys-on-secondary-container, #001b3f);
    }

    .mobile-navigation__links a:focus-visible {
      outline: 3px solid var(--mat-sys-primary, #005cbb);
      outline-offset: -3px;
    }

    .mobile-navigation__github {
      width: 24px;
      height: 24px;
    }

    .mobile-navigation__external {
      margin-inline-start: auto;
    }

    main {
      display: block;
      flex: 1 0 auto;
      min-width: 0;
      outline: none;
    }

    footer {
      border-top: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-low);
      color: var(--mat-sys-on-surface-variant);
    }

    .footer-content {
      display: flex;
      width: min(100% - 48px, 1120px);
      min-height: 56px;
      margin: 0 auto;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font: var(--mat-sys-body-small);
    }

    .footer-content a {
      color: inherit;
      text-underline-offset: 3px;
    }

    @media (width < 960px) {
      .app-header {
        background: var(--mat-sys-surface, #fff);
        backdrop-filter: none;
      }

      mat-toolbar {
        height: 64px;
      }

      .toolbar-content {
        width: calc(100% - 8px);
        gap: 6px;
      }

      .brand {
        min-width: 48px;
        min-height: 48px;
        justify-content: center;
      }

      .brand img {
        height: 44px;
        aspect-ratio: 688 / 318;
      }

      .desktop-navigation {
        display: none;
      }

      .mobile-menu-trigger,
      .mobile-navigation__close {
        display: inline-grid;
        width: 48px;
        height: 48px;
        padding: 0;
        place-items: center;
        color: var(--mat-sys-on-surface, #1f1f1f);
      }

      .toolbar-actions {
        display: none;
      }
    }

    @media (max-width: 760px) {
      .footer-content {
        width: min(100% - 28px, 1120px);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly mobileNavigationDialog = viewChild.required<ElementRef<HTMLDialogElement>>('mobileNavigation');
  protected readonly mobileMenuOpen = signal(false);
  protected readonly navigationItems: ReadonlyArray<PrimaryNavigationItem> = [
    { label: 'Run audit', route: '/audits/user-flow', icon: 'speed', exact: true },
    { label: 'Audit history', route: '/audits/history', icon: 'history', exact: true },
    { label: 'Trace tools', route: '/convenience', icon: 'construction', exact: false },
  ];
  protected readonly mobileNavigationItems: ReadonlyArray<PrimaryNavigationItem> = [
    { label: 'Home', route: '/', icon: 'home', exact: true },
    ...this.navigationItems,
  ];

  constructor() {
    inject(BreakpointObserver)
      .observe('(width < 960px)')
      .pipe(takeUntilDestroyed())
      .subscribe(({ matches }) => {
        if (!matches && this.mobileMenuOpen()) {
          this.mobileNavigationDialog().nativeElement.close();
        }
      });
  }

  protected openMobileNavigation(event: MouseEvent): void {
    if (event.currentTarget instanceof HTMLButtonElement) {
      event.currentTarget.focus();
    }
    this.mobileNavigationDialog().nativeElement.showModal();
    this.mobileMenuOpen.set(true);
  }

  protected dismissFromBackdrop(event: MouseEvent): void {
    const dialog = this.mobileNavigationDialog().nativeElement;
    if (event.target === dialog) {
      dialog.close();
    }
  }
}
