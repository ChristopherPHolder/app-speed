import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatListItem, MatNavList } from '@angular/material/list';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { MatToolbar } from '@angular/material/toolbar';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'portal-shell',
  imports: [
    MatSidenavContainer,
    MatSidenav,
    MatSidenavContent,
    MatToolbar,
    MatNavList,
    MatIcon,
    MatIconButton,
    MatListItem,
    RouterLink,
    RouterOutlet,
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #drawer class="sidenav" fixedInViewport [attr.role]="'dialog'" [mode]="'over'">
        <mat-toolbar>Menu</mat-toolbar>
        @defer (on immediate) {
          <mat-nav-list>
            @for (navItem of sideNavItems; track navItem) {
              <a mat-list-item [routerLink]="navItem.route" (click)="drawer.close()">{{ navItem.name }}</a>
            }
          </mat-nav-list>
        }
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar>
          @defer (on immediate) {
            <button type="button" aria-label="Toggle sidenav" mat-icon-button (click)="drawer.open()">
              <mat-icon aria-label="Side nav toggle icon">menu</mat-icon>
            </button>
          }
          <span style="display:contents">
            <img src="assets/logo.svg" alt="App Speed Logo" height="150%" width="auto" />
          </span>
        </mat-toolbar>
        <main>
          <router-outlet />
        </main>
        <footer>
          <p>Made with ❤️ by <a href="https://x.com/chrispholder">Chris</a></p>
        </footer>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    .sidenav-container {
      height: 100%;
    }
    .sidenav {
      width: 200px;
    }
    .sidenav .mat-toolbar {
      background: inherit;
    }
    .mat-toolbar.mat-primary {
      position: sticky;
      top: 0;
      z-index: 1;
    }
    mat-toolbar {
      background-color: #ecf0ff;
    }
    mat-sidenav-content {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    footer {
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #ecf0ff;
      color: #333;
      margin-top: auto;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  readonly sideNavItems = [
    { name: 'Audit Builder', route: 'user-flow' },
    { name: 'Audit Viewer', route: 'user-flow/viewer' },
  ];
}
