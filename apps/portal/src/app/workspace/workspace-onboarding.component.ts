import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormField, form, maxLength, pattern, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatListItem, MatListItemIcon, MatListItemTitle, MatNavList } from '@angular/material/list';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';
import { WorkspaceState } from './workspace-state.service';

@Component({
  selector: 'app-workspace-onboarding',
  imports: [
    FormField,
    MatButton,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardSubtitle,
    MatCardTitle,
    MatFormField,
    MatLabel,
    MatError,
    MatIcon,
    MatInput,
    MatListItem,
    MatListItemIcon,
    MatListItemTitle,
    MatNavList,
    MatProgressBar,
    RouterLink,
  ],
  template: `
    <section class="entry" aria-labelledby="entry-title">
      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title
            ><h1 id="entry-title">
              {{ step() === 'workspace' ? 'Create a workspace' : 'Create or join a workspace' }}
            </h1></mat-card-title
          >
          @if (state.overview(); as accountOverview) {
            <mat-card-subtitle>{{ accountOverview.account.email }}</mat-card-subtitle>
          }
        </mat-card-header>
        <mat-card-content>
          @if (state.loading() || state.saving()) {
            <mat-progress-bar mode="indeterminate" aria-label="Loading workspace" />
          }
          @if (state.error()) {
            <p class="error" role="alert">{{ state.error() }}</p>
            <button matButton type="button" (click)="retry()" [disabled]="state.loading() || state.saving()">
              Try again
            </button>
          }
          @if (!pendingWorkspace() && state.overview(); as overview) {
            @if (step() === 'choose') {
              @if (overview.invitations.length) {
                <h2>Invitations</h2>
                @for (invitation of overview.invitations; track invitation.id) {
                  <div class="invitation">
                    <div>
                      <strong>{{ invitation.workspaceName }}</strong>
                      <p>Join as {{ invitation.role }}</p>
                    </div>
                    <div class="actions">
                      <button
                        matButton="filled"
                        type="button"
                        [disabled]="state.saving() || state.loading()"
                        (click)="accept(invitation.id)"
                      >
                        Accept
                      </button>
                      <button
                        matButton
                        type="button"
                        [disabled]="state.saving() || state.loading()"
                        (click)="state.act({ action: 'declineInvitation', invitationId: invitation.id })"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                }
              }
              @if (overview.workspaces.length) {
                <h2>Your workspaces</h2>
                <mat-nav-list aria-label="Your workspaces">
                  @for (workspace of overview.workspaces; track workspace.id) {
                    <a mat-list-item [routerLink]="state.workspaceLink(workspace.id)"
                      ><mat-icon matListItemIcon>business</mat-icon
                      ><span matListItemTitle>{{ workspace.name }}</span></a
                    >
                  }
                </mat-nav-list>
              }
              <p>
                {{
                  overview.invitations.length
                    ? 'You can also create a workspace for another team or for personal work.'
                    : 'Create a workspace for your team or personal work. To join one, ask its admin to invite the email above.'
                }}
              </p>
              <button
                [matButton]="overview.invitations.length ? 'outlined' : 'filled'"
                type="button"
                (click)="startWorkspace()"
                [disabled]="state.loading() || state.saving()"
              >
                <mat-icon>add</mat-icon>Create workspace
              </button>
            } @else {
              <p>
                Give your team or personal work a home. Your first project will have the same name as your workspace.
              </p>
              <form (submit)="submitName($event)">
                <mat-form-field appearance="outline">
                  <mat-label>Workspace name</mat-label>
                  <input #nameInput matInput autocomplete="off" [formField]="nameForm.name" />
                  <mat-error>Enter a name of 1–100 characters.</mat-error>
                </mat-form-field>
                <div class="actions">
                  <button matButton type="button" [disabled]="state.saving()" (click)="step.set('choose')">Back</button>
                  <button
                    matButton="filled"
                    type="submit"
                    [disabled]="nameForm().invalid() || state.loading() || state.saving()"
                  >
                    Create workspace
                  </button>
                </div>
              </form>
            }
          }
        </mat-card-content>
      </mat-card>
      <a matButton routerLink="/public">Back to Public View</a>
    </section>
  `,
  styles: `
    .entry {
      display: grid;
      justify-items: center;
      gap: 16px;
      padding: clamp(24px, 6vw, 72px) 16px;
    }
    mat-card {
      width: min(100%, 520px);
      box-sizing: border-box;
    }
    mat-card-header {
      padding: 24px 24px 8px;
    }
    mat-card-content {
      padding: 16px 24px 24px;
    }
    h1 {
      font: var(--mat-sys-headline-small);
      margin: 0 0 4px;
    }
    h2 {
      font: var(--mat-sys-title-medium);
      margin: 16px 0 8px;
    }
    p {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
      margin: 0 0 16px;
    }
    mat-nav-list {
      margin-bottom: 12px;
    }
    mat-form-field {
      width: 100%;
    }
    .actions,
    .invitation {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    .invitation {
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }
    .invitation p {
      margin: 4px 0 0;
    }
    .invitation:last-of-type {
      margin-bottom: 20px;
    }
    .error {
      color: var(--mat-sys-error);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceOnboardingComponent {
  protected readonly state = inject(WorkspaceState);
  private readonly router = inject(Router);
  protected readonly step = signal<'choose' | 'workspace'>('choose');
  private readonly name = signal({ name: '' });
  protected readonly pendingWorkspace = signal('');
  protected readonly nameForm = form(this.name, (fields) => {
    required(fields.name);
    maxLength(fields.name, 100);
    pattern(fields.name, /\S/);
  });
  private readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');
  constructor() {
    afterNextRender(() => {
      if (!this.state.overview() && !this.state.error()) void this.state.refresh();
    });
    afterRenderEffect(() => {
      if (this.step() !== 'choose') this.nameInput()?.nativeElement.focus();
    });
  }
  protected startWorkspace(): void {
    this.name.set({ name: '' });
    this.step.set('workspace');
  }
  protected async submitName(event: Event): Promise<void> {
    event.preventDefault();
    if (this.nameForm().invalid()) return;
    const name = this.name().name.trim();
    if (this.step() === 'workspace') {
      if (await this.state.act({ action: 'createWorkspace', name })) await this.openWorkspace();
      else if (this.state.refreshRequired()) this.pendingWorkspace.set(this.state.workspaceId());
    }
  }
  protected async accept(invitationId: string): Promise<void> {
    if (await this.state.act({ action: 'acceptInvitation', invitationId }))
      await this.router.navigate(['/workspaces', this.state.workspaceId()]);
    else if (this.state.refreshRequired()) this.pendingWorkspace.set(this.state.workspaceId());
  }
  protected async retry(): Promise<void> {
    if ((await this.state.refresh()) && this.pendingWorkspace()) {
      this.state.selectWorkspace(this.pendingWorkspace());
      await this.openWorkspace();
    }
  }
  private async openWorkspace(): Promise<void> {
    const workspaceId = this.state.workspaceId();
    const projectId = this.state.projectId();
    await this.router.navigate(
      projectId ? ['/workspaces', workspaceId, 'projects', projectId] : ['/workspaces', workspaceId],
    );
  }
}
