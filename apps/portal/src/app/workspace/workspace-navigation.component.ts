import { ChangeDetectionStrategy, Component, afterNextRender, inject, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatDivider } from '@angular/material/divider';
import { MatListItem, MatListItemIcon, MatListItemTitle, MatNavList } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AccountMenuComponent } from '../auth/account-menu.component';
import { WorkspaceState } from './workspace-state.service';
import { WorkspaceSwitcherComponent } from './workspace-switcher.component';

@Component({
  selector: 'app-workspace-navigation',
  imports: [
    MatIcon,
    MatDivider,
    MatListItem,
    MatListItemIcon,
    MatListItemTitle,
    MatNavList,
    RouterLink,
    RouterLinkActive,
    WorkspaceSwitcherComponent,
    AccountMenuComponent,
  ],
  template: `
    <app-workspace-switcher (navigate)="navigate.emit()" />
    @if (state.workspace(); as workspace) {
      <mat-nav-list aria-label="Workspace navigation">
        <a
          mat-list-item
          [routerLink]="['/workspaces', workspace.id]"
          routerLinkActive
          #projects="routerLinkActive"
          [routerLinkActiveOptions]="{ exact: true }"
          [activated]="projects.isActive"
          ariaCurrentWhenActive="page"
          (click)="navigate.emit()"
        >
          <mat-icon matListItemIcon>dashboard</mat-icon><span matListItemTitle>Projects</span>
        </a>
      </mat-nav-list>
      @if (workspace.projects.length) {
        <p class="group-label">Your projects</p>
        <mat-nav-list aria-label="Projects">
          @for (project of workspace.projects; track project.id) {
            <a
              mat-list-item
              [routerLink]="['/workspaces', workspace.id, 'projects', project.id]"
              routerLinkActive
              #link="routerLinkActive"
              [activated]="link.isActive"
              ariaCurrentWhenActive="page"
              (click)="navigate.emit()"
            >
              <mat-icon matListItemIcon>folder</mat-icon><span matListItemTitle>{{ project.name }}</span>
            </a>
          }
        </mat-nav-list>
      }
    } @else {
      <mat-nav-list aria-label="Workspace navigation">
        <a mat-list-item routerLink="/workspaces/join" (click)="navigate.emit()"
          ><mat-icon matListItemIcon>add</mat-icon><span matListItemTitle>Create or join a workspace</span></a
        >
      </mat-nav-list>
    }
    <mat-divider />
    <p class="group-label">Audit tools</p>
    <mat-nav-list aria-label="Audit tools">
      @for (tool of tools; track tool.path) {
        <a
          mat-list-item
          [routerLink]="tool.path"
          [queryParams]="tool.path.startsWith('/audits') && state.project() ? { projectId: state.projectId() } : {}"
          routerLinkActive
          #link="routerLinkActive"
          [routerLinkActiveOptions]="{ exact: tool.exact }"
          [activated]="link.isActive"
          ariaCurrentWhenActive="page"
          (click)="navigate.emit()"
        >
          <mat-icon matListItemIcon>{{ tool.icon }}</mat-icon
          ><span matListItemTitle>{{ tool.label }}</span>
        </a>
      }
    </mat-nav-list>
    @if (showAccount()) {
      <div class="account"><mat-divider /><app-account-menu /></div>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      padding: 12px;
      min-height: 100%;
      box-sizing: border-box;
    }
    .group-label {
      font: var(--mat-sys-label-medium);
      color: var(--mat-sys-on-surface-variant);
      margin: 16px 16px 0;
    }
    .account {
      margin-top: auto;
    }
    .account app-account-menu {
      display: block;
      padding-top: 8px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceNavigationComponent {
  protected readonly state = inject(WorkspaceState);
  readonly showAccount = input(true);
  readonly navigate = output<void>();
  protected readonly tools = [
    { path: '/audits/user-flow', label: 'Run audit', icon: 'speed', exact: true },
    { path: '/audits/history', label: 'Audit history', icon: 'history', exact: true },
    { path: '/convenience', label: 'Trace tools', icon: 'construction', exact: false },
  ];
  constructor() {
    afterNextRender(() => {
      if (!this.state.overview() && !this.state.error()) void this.state.refresh();
    });
  }
}
