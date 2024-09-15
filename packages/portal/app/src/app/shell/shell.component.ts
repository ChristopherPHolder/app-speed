import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIconButton } from '@angular/material/button';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { MatListItem, MatNavList } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-shell',
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
        <mat-toolbar color="primary">
          @defer (on immediate) {
            <button type="button" aria-label="Toggle sidenav" mat-icon-button (click)="drawer.open()">
              <mat-icon aria-label="Side nav toggle icon">menu</mat-icon>
            </button>
          }
          <span style="display:contents">
            <img src="assets/logo.svg" alt="App Speed Logo" height="150%" width="auto" />
          </span>
        </mat-toolbar>
        <ng-content />
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
  `,
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  ],
})
export default class ShellComponent {
  readonly sideNavItems = [
    { name: 'Audit Builder', route: 'user-flow' },
    { name: 'Audit Viewer', route: 'user-flow/viewer' },
  ];
}
