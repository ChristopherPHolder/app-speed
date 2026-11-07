import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatListItem, MatListItemIcon, MatListItemTitle, MatNavList } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { PortalAuthService } from '../auth/portal-auth.service';
import { WorkspaceState } from './workspace-state.service';

@Component({
  selector: 'app-public-view',
  imports: [
    MatAnchor,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatIcon,
    MatListItem,
    MatListItemIcon,
    MatListItemTitle,
    MatNavList,
    RouterLink,
  ],
  template: `
    <section aria-labelledby="public-title">
      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title><h1 id="public-title">Public View</h1></mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>
            This is the same public view available without signing in. Run an audit, browse public audit history, or
            explore trace tools. Workspace and project data stay separate.
          </p>
          <mat-nav-list aria-label="Public tools">
            <a mat-list-item routerLink="/audits/user-flow">
              <mat-icon matListItemIcon>speed</mat-icon><span matListItemTitle>Run audit</span>
            </a>
            <a mat-list-item routerLink="/audits/history">
              <mat-icon matListItemIcon>history</mat-icon><span matListItemTitle>Public audit history</span>
            </a>
            <a mat-list-item routerLink="/convenience">
              <mat-icon matListItemIcon>construction</mat-icon><span matListItemTitle>Trace tools</span>
            </a>
          </mat-nav-list>
          @if (auth.signedIn()) {
            <a matButton="tonal" routerLink="/workspaces/join">
              <mat-icon>add</mat-icon>
              Create or join a workspace
              @if (state.overview()?.invitations?.length; as count) {
                ({{ count }})
              }
            </a>
          }
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: `
    section {
      width: min(100% - 32px, 680px);
      margin: clamp(24px, 5vw, 56px) auto;
    }
    h1 {
      margin: 0;
      font: var(--mat-sys-headline-medium);
    }
    p {
      margin: 12px 0 8px;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }
    mat-nav-list {
      margin-bottom: 12px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicViewComponent {
  protected readonly auth = inject(PortalAuthService);
  protected readonly state = inject(WorkspaceState);

  constructor() {
    this.state.selectPublicView();
  }
}
