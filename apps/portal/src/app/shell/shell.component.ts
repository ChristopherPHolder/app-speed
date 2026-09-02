import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
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
            <a class="brand" routerLink="/" aria-label="App Speed home">
              <img src="assets/logo.svg" alt="" />
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

              <button
                class="mobile-menu-trigger"
                type="button"
                mat-icon-button
                aria-controls="mobile-navigation"
                [attr.aria-expanded]="mobileMenuOpen()"
                [attr.aria-label]="mobileMenuOpen() ? 'Close navigation menu' : 'Open navigation menu'"
                (click)="mobileMenuOpen.update((open) => !open)"
              >
                <mat-icon aria-hidden="true">{{ mobileMenuOpen() ? 'close' : 'menu' }}</mat-icon>
              </button>
            </div>
          </div>
        </mat-toolbar>

        @if (mobileMenuOpen()) {
          <button
            class="navigation-scrim"
            type="button"
            aria-hidden="true"
            tabindex="-1"
            (click)="mobileMenuOpen.set(false)"
          ></button>
          <nav id="mobile-navigation" class="mobile-navigation" aria-label="Mobile navigation">
            <span class="mobile-navigation__label">Navigate</span>
            @for (item of navigationItems; track item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="active-navigation-item"
                [routerLinkActiveOptions]="{ exact: item.exact }"
                ariaCurrentWhenActive="page"
                (click)="mobileMenuOpen.set(false)"
              >
                <mat-icon aria-hidden="true">{{ item.icon }}</mat-icon>
                <span>{{ item.label }}</span>
                <mat-icon class="mobile-navigation__arrow" aria-hidden="true">arrow_forward</mat-icon>
              </a>
            }
            <a
              class="mobile-navigation__github"
              href="https://github.com/ChristopherPHolder/app-speed"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="assets/GitHub_Invertocat_Black.svg" alt="" />
              <span>View on GitHub</span>
              <mat-icon class="mobile-navigation__arrow" aria-hidden="true">open_in_new</mat-icon>
            </a>
          </nav>
        }
      </header>

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
      position: absolute;
      top: calc(100% + 8px);
      right: 14px;
      z-index: 2;
      display: none;
      width: min(320px, calc(100vw - 28px));
      padding: 10px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 16px;
      background: #fff;
      box-shadow: 0 16px 40px rgb(31 31 31 / 18%);
      gap: 3px;
    }

    .mobile-navigation__label {
      padding: 8px 12px 10px;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-small);
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .mobile-navigation a {
      display: flex;
      min-height: 50px;
      padding: 0 12px;
      border-radius: 13px;
      align-items: center;
      gap: 12px;
      color: var(--mat-sys-on-surface);
      text-decoration: none;
    }

    .mobile-navigation a:hover,
    .mobile-navigation a.active-navigation-item {
      background: #e9f2ff;
      color: var(--mat-sys-primary);
    }

    .mobile-navigation a:focus-visible {
      outline: 3px solid var(--mat-sys-primary);
      outline-offset: -1px;
    }

    .mobile-navigation__arrow {
      width: 19px;
      height: 19px;
      margin-left: auto;
      font-size: 19px;
      opacity: 0.72;
    }

    .mobile-navigation__github {
      margin-top: 7px;
      border-top: 1px solid rgb(7 26 50 / 8%);
      border-radius: 0 0 13px 13px;
    }

    .mobile-navigation__github img {
      width: 22px;
      height: 22px;
    }

    .navigation-scrim {
      position: fixed;
      inset: 0;
      z-index: 1;
      display: none;
      border: 0;
      background: rgb(7 26 50 / 28%);
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

    @media (max-width: 760px) {
      mat-toolbar {
        height: 68px;
      }

      .toolbar-content,
      .footer-content {
        width: min(100% - 28px, 1120px);
      }

      .brand img {
        height: 54px;
      }

      .desktop-navigation {
        display: none;
      }

      .mobile-menu-trigger {
        display: inline-flex;
        margin-right: -8px;
        color: var(--mat-sys-on-surface);
      }

      .mobile-navigation {
        display: grid;
      }

      .navigation-scrim {
        display: block;
      }

      .github-link {
        display: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  protected readonly mobileMenuOpen = signal(false);
  protected readonly navigationItems: ReadonlyArray<PrimaryNavigationItem> = [
    { label: 'Run audit', route: '/audits/user-flow', icon: 'speed', exact: true },
    { label: 'Audit history', route: '/audits/history', icon: 'history', exact: true },
    { label: 'Trace tools', route: '/convenience', icon: 'construction', exact: false },
  ];
}
