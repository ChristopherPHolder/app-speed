import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import {
  MatActionList,
  MatListItem,
  MatListItemAvatar,
  MatListItemMeta,
  MatListItemTitle,
} from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { MatDivider } from '@angular/material/divider';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { WorkspaceAvatarComponent } from './workspace-avatar.component';
import { publicViewId, WorkspaceState } from './workspace-state.service';

@Component({
  selector: 'app-workspace-switcher',
  imports: [
    MatActionList,
    MatListItem,
    MatListItemAvatar,
    MatListItemMeta,
    MatListItemTitle,
    MatIcon,
    MatDivider,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    RouterLink,
    WorkspaceAvatarComponent,
  ],
  template: `
    <mat-action-list aria-label="Workspace selection">
      <button
        mat-list-item
        type="button"
        [matMenuTriggerFor]="menu"
        class="trigger"
        [attr.aria-label]="'Switch workspace: ' + (state.workspace()?.name ?? 'Public View')"
      >
        <app-workspace-avatar
          matListItemAvatar
          class="trigger-avatar"
          [name]="state.workspace()?.name ?? 'Public View'"
          [logo]="state.workspace()?.logo ?? null"
        />
        <span matListItemTitle>{{ state.workspace()?.name ?? 'Public View' }}</span>
        <span matListItemMeta><mat-icon aria-hidden="true">unfold_more</mat-icon></span>
      </button>
    </mat-action-list>
    <mat-menu #menu="matMenu" aria-label="Workspace switcher">
      <a
        mat-menu-item
        routerLink="/public"
        (click)="navigate.emit()"
        [attr.aria-current]="!state.workspace() ? 'true' : null"
      >
        <mat-icon aria-hidden="true">{{
          state.workspaceId() === publicViewId || !state.workspace() ? 'check' : 'public'
        }}</mat-icon>
        <span>Public View</span>
      </a>
      @for (workspace of state.overview()?.workspaces ?? []; track workspace.id) {
        <a
          mat-menu-item
          [routerLink]="state.workspaceLink(workspace.id)"
          (click)="navigate.emit()"
          [attr.aria-current]="workspace.id === state.workspaceId() ? 'true' : null"
        >
          <span class="workspace-option">
            @if (workspace.logo) {
              <app-workspace-avatar [name]="workspace.name" [logo]="workspace.logo" />
            } @else {
              <mat-icon aria-hidden="true">business</mat-icon>
            }
            @if (workspace.id === state.workspaceId()) {
              <mat-icon aria-hidden="true">check</mat-icon>
            }
            <span>{{ workspace.name }}</span>
          </span>
        </a>
      }
      @if (state.workspace(); as workspace) {
        <mat-divider />
        <a mat-menu-item [routerLink]="['/workspaces', workspace.id, 'settings']" (click)="navigate.emit()">
          <mat-icon aria-hidden="true">settings</mat-icon><span>Workspace settings</span>
        </a>
      }
      <a mat-menu-item routerLink="/workspaces/join" (click)="navigate.emit()">
        <mat-icon aria-hidden="true">add</mat-icon>
        <span
          >Create or join a workspace
          @if (state.overview()?.invitations?.length; as count) {
            ({{ count }})
          }
        </span>
      </a>
    </mat-menu>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    mat-action-list {
      padding: 0;
    }
    .trigger {
      height: 56px;
      border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-surface-container);
    }
    .trigger .trigger-avatar {
      width: 32px;
      height: 32px;
      border-radius: var(--mat-sys-corner-small);
    }
    .workspace-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .workspace-option app-workspace-avatar {
      --workspace-avatar-size: 20px;
      --workspace-avatar-radius: var(--mat-sys-corner-extra-small);
    }
    .workspace-option mat-icon {
      margin: 0;
      width: 20px;
      height: 20px;
      font-size: 20px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceSwitcherComponent {
  protected readonly publicViewId = publicViewId;
  protected readonly state = inject(WorkspaceState);
  readonly navigate = output<void>();
}
