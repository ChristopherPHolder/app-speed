import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormField, email, form, maxLength, required } from '@angular/forms/signals';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import {
  MatList,
  MatListItem,
  MatListItemIcon,
  MatListItemLine,
  MatListItemMeta,
  MatListItemTitle,
  MatNavList,
} from '@angular/material/list';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { Router, RouterLink } from '@angular/router';
import type { WorkspaceAction } from '@app-speed/workspace/domain';
import { firstValueFrom } from 'rxjs';
import { WorkspaceConfirmDialogComponent, type WorkspaceConfirmDialogData } from './workspace-confirm-dialog.component';
import { WorkspaceLogoSettingsComponent } from './workspace-logo-settings.component';
import { WorkspaceNameDialogComponent, type WorkspaceNameDialogData } from './workspace-name-dialog.component';
import { WorkspaceState } from './workspace-state.service';

type WorkspaceView = 'projects' | 'project' | 'general' | 'members' | 'access';

@Component({
  selector: 'app-workspace-page',
  imports: [
    FormField,
    MatButton,
    MatIconButton,
    MatCard,
    MatCardContent,
    MatError,
    MatFormField,
    MatLabel,
    MatIcon,
    MatInput,
    MatList,
    MatListItem,
    MatListItemIcon,
    MatListItemLine,
    MatListItemMeta,
    MatListItemTitle,
    MatNavList,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatOption,
    MatSelect,
    MatProgressBar,
    MatTabLink,
    MatTabNav,
    MatTabNavPanel,
    RouterLink,
    WorkspaceLogoSettingsComponent,
  ],
  template: `
    @if (state.workspace(); as workspace) {
      <section class="page" [attr.aria-busy]="state.loading() || state.saving()" aria-labelledby="workspace-title">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a [routerLink]="['/workspaces', workspace.id]">{{ workspace.name }}</a>
          <mat-icon aria-hidden="true">chevron_right</mat-icon>
          @if (view() === 'access' && state.project(); as project) {
            <a [routerLink]="['/workspaces', workspace.id, 'projects', project.id]">{{ project.name }}</a
            ><mat-icon aria-hidden="true">chevron_right</mat-icon>
          }
          <span>{{
            view() === 'general' || view() === 'members' || view() === 'access' ? 'Settings' : 'Projects'
          }}</span>
        </nav>
        @if (state.loading() || state.saving()) {
          <mat-progress-bar mode="indeterminate" aria-label="Updating workspace" />
        }
        @if (state.error()) {
          <p role="alert" class="error">{{ state.error() }}</p>
          @if (state.refreshRequired()) {
            <button matButton type="button" [disabled]="state.loading() || state.saving()" (click)="state.refresh()">
              Reload saved changes
            </button>
          }
        }
        @if (state.notice()) {
          <p role="status" class="notice">{{ state.notice() }}</p>
        }
        @switch (view()) {
          @case ('projects') {
            <div class="page-heading">
              <div>
                <h1 id="workspace-title">Projects</h1>
                <p>Projects in {{ workspace.name }}</p>
              </div>
              @if (workspace.role === 'admin' && workspace.projects.length) {
                <button matButton="filled" type="button" [disabled]="busy()" (click)="createProject()">
                  <mat-icon>add</mat-icon>New project
                </button>
              }
            </div>
            @if (workspace.projects.length) {
              <mat-nav-list class="project-list" aria-label="Workspace projects">
                @for (project of workspace.projects; track project.id) {
                  <a mat-list-item [routerLink]="['/workspaces', workspace.id, 'projects', project.id]">
                    <mat-icon matListItemIcon>folder</mat-icon><span matListItemTitle>{{ project.name }}</span
                    ><span matListItemMeta><mat-icon aria-hidden="true">chevron_right</mat-icon></span>
                  </a>
                }
              </mat-nav-list>
            } @else {
              <mat-card appearance="outlined" class="empty"
                ><mat-card-content>
                  <mat-icon class="empty-icon" aria-hidden="true">folder_open</mat-icon>
                  <h2>{{ workspace.role === 'admin' ? 'Create your first project' : 'No projects yet' }}</h2>
                  <p>
                    {{
                      workspace.role === 'admin'
                        ? 'Add a project for the site or app you want to audit.'
                        : 'Ask a workspace admin to give you access to a project.'
                    }}
                  </p>
                  @if (workspace.role === 'admin') {
                    <button matButton="filled" type="button" [disabled]="busy()" (click)="createProject()">
                      <mat-icon>add</mat-icon>Create project
                    </button>
                  }
                </mat-card-content></mat-card
              >
            }
          }
          @case ('project') {
            @if (state.project(); as project) {
              <div class="page-heading">
                <div>
                  <h1 id="workspace-title">{{ project.name }}</h1>
                  <p>{{ workspace.name }}</p>
                </div>
                @if (workspace.role === 'admin') {
                  <a
                    matButton="outlined"
                    [routerLink]="['/workspaces', workspace.id, 'projects', project.id, 'settings']"
                    ><mat-icon>settings</mat-icon>Project settings</a
                  >
                }
              </div>
              <mat-card appearance="outlined" class="empty"
                ><mat-card-content>
                  <mat-icon class="empty-icon" aria-hidden="true">speed</mat-icon>
                  <h2>Project overview</h2>
                  <p>Audits run here are private to this project and its authorized members.</p>
                  <a matButton routerLink="/audits/user-flow" [queryParams]="{ projectId: state.projectId() }"
                    >Run audit</a
                  >
                  <a matButton routerLink="/audits/history" [queryParams]="{ projectId: state.projectId() }"
                    >Audit history</a
                  >
                </mat-card-content></mat-card
              >
            }
          }
          @case ('access') {
            @if (state.project(); as project) {
              <div class="page-heading">
                <div>
                  <h1 id="workspace-title">Project settings</h1>
                  <p>{{ project.name }}</p>
                </div>
              </div>
              <h2>General</h2>
              <div class="settings-row">
                <div>
                  <strong>Project name</strong>
                  <p>{{ project.name }}</p>
                </div>
                @if (workspace.role === 'admin') {
                  <button
                    matButton="outlined"
                    type="button"
                    [disabled]="busy()"
                    (click)="
                      editName({
                        title: 'Rename project',
                        name: project.name,
                        target: { action: 'renameProject', workspaceId: workspace.id, projectId: project.id },
                      })
                    "
                  >
                    Rename project
                  </button>
                }
              </div>
              <h2>Project access</h2>
              <p>Workspace admins have access to every project. Members need an individual grant.</p>
              <mat-list aria-label="Project access">
                @for (member of workspace.members; track member.accountId) {
                  <mat-list-item>
                    <mat-icon matListItemIcon>person</mat-icon><span matListItemTitle>{{ member.name }}</span
                    ><span matListItemLine>{{ member.email }}</span>
                    @if (member.role === 'admin') {
                      <span matListItemMeta class="role">Admin</span>
                    } @else if (workspace.role === 'admin') {
                      <button
                        matButton
                        matListItemMeta
                        type="button"
                        [disabled]="busy()"
                        [attr.aria-label]="
                          (project.memberIds.includes(member.accountId)
                            ? 'Remove project access for '
                            : 'Grant project access to ') + member.name
                        "
                        (click)="
                          state.act({
                            action: project.memberIds.includes(member.accountId)
                              ? 'revokeProjectAccess'
                              : 'grantProjectAccess',
                            workspaceId: workspace.id,
                            projectId: project.id,
                            accountId: member.accountId,
                          })
                        "
                      >
                        {{ project.memberIds.includes(member.accountId) ? 'Remove access' : 'Grant access' }}
                      </button>
                    } @else if (project.memberIds.includes(member.accountId)) {
                      <span matListItemMeta class="role">Member</span>
                    }
                  </mat-list-item>
                }
              </mat-list>
              @if (workspace.role === 'admin') {
                <section class="danger-zone" aria-label="Delete project">
                  <div>
                    <h2>Delete project</h2>
                    <p>Remove this project and its access grants.</p>
                  </div>
                  <button
                    matButton="outlined"
                    type="button"
                    [disabled]="busy()"
                    (click)="
                      confirm(
                        { action: 'deleteProject', workspaceId: workspace.id, projectId: project.id },
                        {
                          title: 'Delete project?',
                          message: 'This permanently deletes the project and its access grants.',
                          label: 'Delete project',
                        }
                      )
                    "
                  >
                    Delete project
                  </button>
                </section>
              }
            }
          }
          @default {
            <div class="page-heading">
              <div>
                <h1 id="workspace-title">Workspace settings</h1>
                <p>{{ workspace.name }}</p>
              </div>
            </div>
            <nav mat-tab-nav-bar [tabPanel]="settingsPanel" aria-label="Workspace settings">
              <a mat-tab-link [routerLink]="['/workspaces', workspace.id, 'settings']" [active]="view() === 'general'"
                >General</a
              >
              <a
                mat-tab-link
                [routerLink]="['/workspaces', workspace.id, 'settings', 'members']"
                [active]="view() === 'members'"
                >Members</a
              >
            </nav>
            <mat-tab-nav-panel #settingsPanel class="settings-panel">
              @if (view() === 'members') {
                <div class="section-heading">
                  <h2>Members</h2>
                  @if (workspace.role === 'admin') {
                    <button
                      matButton="outlined"
                      type="button"
                      [disabled]="busy()"
                      (click)="showInvite.set(!showInvite())"
                    >
                      <mat-icon>person_add</mat-icon>Invite member
                    </button>
                  }
                </div>
                @if (workspace.role === 'admin' && showInvite()) {
                  <p>Invitations appear when the recipient signs in with the invited email.</p>
                  <form class="invite-form" (submit)="invite($event)">
                    <mat-form-field appearance="outline"
                      ><mat-label>Email address</mat-label
                      ><input matInput type="email" autocomplete="email" [formField]="invitationForm.email" /><mat-error
                        >Enter a valid email address.</mat-error
                      ></mat-form-field
                    >
                    <mat-form-field appearance="outline"
                      ><mat-label>Role</mat-label
                      ><mat-select [formField]="invitationForm.role"
                        ><mat-option value="member">Member</mat-option
                        ><mat-option value="admin">Admin</mat-option></mat-select
                      ></mat-form-field
                    >
                    <button matButton="filled" type="submit" [disabled]="busy() || invitationForm().invalid()">
                      Create invitation
                    </button>
                  </form>
                }
                <mat-list aria-label="Workspace members">
                  @for (member of workspace.members; track member.accountId) {
                    <mat-list-item>
                      <mat-icon matListItemIcon>person</mat-icon><span matListItemTitle>{{ member.name }}</span
                      ><span matListItemLine>{{ member.email }}</span>
                      <span matListItemMeta class="member-actions">
                        <span class="role">{{ member.role }}</span>
                        @if (workspace.role === 'admin') {
                          <button
                            mat-icon-button
                            type="button"
                            [matMenuTriggerFor]="memberMenu"
                            [attr.aria-label]="'Manage ' + member.name"
                            [disabled]="busy()"
                          >
                            <mat-icon>more_vert</mat-icon>
                          </button>
                          <mat-menu #memberMenu="matMenu">
                            <button
                              mat-menu-item
                              type="button"
                              (click)="
                                confirm(
                                  {
                                    action: 'setRole',
                                    workspaceId: workspace.id,
                                    accountId: member.accountId,
                                    role: member.role === 'admin' ? 'member' : 'admin',
                                  },
                                  {
                                    title: 'Change workspace role?',
                                    message:
                                      member.role === 'admin'
                                        ? 'This member will lose admin permissions. At least one admin must remain.'
                                        : 'This member will be able to manage all members and projects in this workspace.',
                                    label: 'Change role',
                                  }
                                )
                              "
                            >
                              Make {{ member.role === 'admin' ? 'member' : 'admin' }}
                            </button>
                            <button
                              mat-menu-item
                              type="button"
                              (click)="
                                confirm(
                                  { action: 'removeMember', workspaceId: workspace.id, accountId: member.accountId },
                                  {
                                    title: 'Remove member?',
                                    message: 'They will lose workspace and project access.',
                                    label: 'Remove member',
                                  }
                                )
                              "
                            >
                              Remove member
                            </button>
                          </mat-menu>
                        }
                      </span>
                    </mat-list-item>
                  }
                </mat-list>
                @if (workspace.role === 'admin' && workspace.invitations.length) {
                  <h2>Pending invitations</h2>
                  <mat-list aria-label="Pending invitations">
                    @for (invitation of workspace.invitations; track invitation.id) {
                      <mat-list-item
                        ><mat-icon matListItemIcon>mail</mat-icon><span matListItemTitle>{{ invitation.email }}</span
                        ><span matListItemLine>{{ invitation.role }} · Expires {{ date(invitation.expiresAt) }}</span>
                        <button
                          matButton
                          matListItemMeta
                          type="button"
                          [disabled]="busy()"
                          (click)="
                            state.act({
                              action: 'revokeInvitation',
                              workspaceId: workspace.id,
                              invitationId: invitation.id,
                            })
                          "
                        >
                          Revoke
                        </button>
                      </mat-list-item>
                    }
                  </mat-list>
                }
              } @else {
                <h2>General</h2>
                <div class="settings-row">
                  <div>
                    <strong>Workspace name</strong>
                    <p>{{ workspace.name }}</p>
                  </div>
                  @if (workspace.role === 'admin') {
                    <button
                      matButton="outlined"
                      type="button"
                      [disabled]="busy()"
                      (click)="
                        editName({
                          title: 'Rename workspace',
                          name: workspace.name,
                          target: { action: 'renameWorkspace', workspaceId: workspace.id },
                        })
                      "
                    >
                      Rename workspace
                    </button>
                  }
                </div>
                <app-workspace-logo-settings [workspace]="workspace" />
                <section class="danger-zone" aria-label="Workspace membership and deletion">
                  <div class="settings-row">
                    <div>
                      <h2>Leave workspace</h2>
                      <p>Remove your membership and project access.</p>
                    </div>
                    <button
                      matButton="outlined"
                      type="button"
                      [disabled]="busy()"
                      (click)="
                        confirm(
                          { action: 'leaveWorkspace', workspaceId: workspace.id },
                          {
                            title: 'Leave workspace?',
                            message: 'You will lose access to its projects. Another admin must remain.',
                            label: 'Leave workspace',
                          }
                        )
                      "
                    >
                      Leave workspace
                    </button>
                  </div>
                  @if (workspace.role === 'admin') {
                    <div class="settings-row">
                      <div>
                        <h2>Delete workspace</h2>
                        <p>Remove this workspace, its projects, and memberships.</p>
                      </div>
                      <button
                        matButton="outlined"
                        type="button"
                        [disabled]="busy()"
                        (click)="
                          confirm(
                            { action: 'deleteWorkspace', workspaceId: workspace.id },
                            {
                              title: 'Delete workspace?',
                              message: 'This permanently deletes its projects, memberships, and invitations.',
                              label: 'Delete workspace',
                            }
                          )
                        "
                      >
                        Delete workspace
                      </button>
                    </div>
                  }
                </section>
              }
            </mat-tab-nav-panel>
          }
        }
      </section>
    } @else {
      <section class="page">
        <h1>Workspace unavailable</h1>
        <p>Choose a workspace you have access to.</p>
        <a matButton routerLink="/workspaces">Open workspaces</a>
      </section>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .page {
      max-width: 980px;
      margin: 0 auto;
      padding: 28px clamp(16px, 4vw, 48px) 48px;
    }
    h1 {
      font: var(--mat-sys-headline-medium);
      margin: 0;
      overflow-wrap: anywhere;
    }
    h2 {
      font: var(--mat-sys-title-large);
      margin: 16px 0 8px;
    }
    p {
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
      margin: 4px 0 12px;
    }
    .breadcrumbs,
    .page-heading,
    .settings-row,
    .section-heading {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }
    .breadcrumbs {
      font: var(--mat-sys-label-medium);
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 24px;
    }
    .breadcrumbs a {
      color: inherit;
      overflow-wrap: anywhere;
    }
    .breadcrumbs mat-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
    }
    .page-heading,
    .settings-row,
    .section-heading {
      justify-content: space-between;
    }
    .page-heading {
      margin: 20px 0 24px;
    }
    .page-heading p {
      margin-bottom: 0;
    }
    .project-list {
      border-block: 1px solid var(--mat-sys-outline-variant);
    }
    .empty {
      max-width: 560px;
    }
    .empty mat-card-content {
      padding: 24px;
    }
    .empty-icon {
      color: var(--mat-sys-primary);
    }
    .settings-panel {
      padding: 20px 0;
    }
    .settings-row {
      padding: 12px 0;
    }
    .settings-row p {
      margin-bottom: 0;
    }
    .role {
      color: var(--mat-sys-on-surface-variant);
      text-transform: capitalize;
    }
    .member-actions {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .invite-form {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: start;
    }
    .danger-zone {
      padding-top: 12px;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }
    .danger-zone button,
    .error {
      color: var(--mat-sys-error);
    }
    .notice {
      color: var(--mat-sys-on-surface-variant);
    }
    @media (width < 600px) {
      .invite-form mat-form-field {
        width: 100%;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspacePageComponent {
  readonly view = input<WorkspaceView>('projects');
  protected readonly state = inject(WorkspaceState);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  protected readonly showInvite = signal(false);
  private readonly invitation = signal<{ email: string; role: 'admin' | 'member' }>({ email: '', role: 'member' });
  protected readonly invitationForm = form(this.invitation, (fields) => {
    required(fields.email);
    email(fields.email);
    maxLength(fields.email, 254);
  });
  protected busy(): boolean {
    return this.state.loading() || this.state.saving() || this.state.refreshRequired();
  }
  protected createProject(): void {
    void this.editName({
      title: 'Create project',
      name: '',
      target: { action: 'createProject', workspaceId: this.state.workspaceId() },
    });
  }
  protected async editName(data: WorkspaceNameDialogData): Promise<void> {
    const saved = await firstValueFrom(
      this.dialog
        .open<WorkspaceNameDialogComponent, WorkspaceNameDialogData, boolean>(WorkspaceNameDialogComponent, {
          data,
          width: '440px',
          maxWidth: 'calc(100vw - 32px)',
          autoFocus: 'input',
        })
        .afterClosed(),
    );
    if (saved && data.target.action === 'createProject')
      await this.router.navigate(['/workspaces', data.target.workspaceId, 'projects', this.state.projectId()]);
  }
  protected async invite(event: Event): Promise<void> {
    event.preventDefault();
    if (this.invitationForm().invalid()) return;
    if (
      await this.state.act({
        action: 'inviteMember',
        workspaceId: this.state.workspaceId(),
        email: this.invitation().email.trim(),
        role: this.invitation().role,
      })
    ) {
      this.invitation.set({ email: '', role: 'member' });
      this.showInvite.set(false);
    }
  }
  protected async confirm(action: WorkspaceAction, data: WorkspaceConfirmDialogData): Promise<void> {
    const confirmed = await firstValueFrom(
      this.dialog
        .open<WorkspaceConfirmDialogComponent, WorkspaceConfirmDialogData, boolean>(WorkspaceConfirmDialogComponent, {
          data,
          width: '440px',
          maxWidth: 'calc(100vw - 32px)',
        })
        .afterClosed(),
    );
    if (!confirmed || !(await this.state.act(action))) return;
    if (
      action.action === 'deleteWorkspace' ||
      action.action === 'leaveWorkspace' ||
      (action.action === 'removeMember' && action.accountId === this.state.overview()?.account.id)
    ) {
      await this.router.navigateByUrl('/workspaces');
    } else if (action.action === 'deleteProject') await this.router.navigate(['/workspaces', action.workspaceId]);
  }
  protected date(value: string): string {
    return new Date(value).toLocaleDateString();
  }
}
