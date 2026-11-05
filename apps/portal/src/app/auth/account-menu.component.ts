import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { PortalAuthService } from './portal-auth.service';

@Component({
  selector: 'app-account-menu',
  imports: [MatIconButton, MatIcon, MatMenu, MatMenuItem, MatMenuTrigger],
  template: `
    <button mat-icon-button type="button" [matMenuTriggerFor]="accountMenu" aria-label="Open account menu">
      @if (auth.accountImageUrl() && failedImageUrl() !== auth.accountImageUrl()) {
        <img
          class="avatar"
          [src]="auth.accountImageUrl()"
          width="32"
          height="32"
          alt=""
          referrerpolicy="no-referrer"
          (error)="failedImageUrl.set(auth.accountImageUrl())"
        />
      } @else {
        <mat-icon aria-hidden="true">account_circle</mat-icon>
      }
    </button>
    <mat-menu #accountMenu="matMenu">
      <span class="account-label">{{ auth.accountLabel() }}</span>
      <button mat-menu-item type="button" [disabled]="busy()" (click)="signOut()">
        <mat-icon aria-hidden="true">logout</mat-icon>
        <span>Sign out</span>
      </button>
    </mat-menu>
    @if (error()) {
      <span class="error" role="alert">{{ error() }}</span>
    }
  `,
  styles: `
    .avatar {
      display: block;
      border-radius: 50%;
      object-fit: cover;
    }
    .account-label {
      display: block;
      padding: 12px 16px;
      max-width: 240px;
      overflow-wrap: anywhere;
      font: var(--mat-sys-body-medium);
    }
    .error {
      color: var(--mat-sys-error);
      font: var(--mat-sys-body-small);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountMenuComponent {
  protected readonly auth = inject(PortalAuthService);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly failedImageUrl = signal('');

  protected async signOut(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.auth.signOut();
    } catch (error) {
      this.error.set(await this.auth.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
