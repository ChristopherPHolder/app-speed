import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from './auth.service';

@Component({
  selector: 'platform-account',
  imports: [MatButton, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="account-bar">
      @if (auth.userId()) {
        <div class="space-picker">
          <span class="space-icon"
            ><mat-icon>{{ organization() ? 'domain' : 'person_outline' }}</mat-icon></span
          >
          <label
            ><span>Workspace</span
            ><select aria-label="Active space" (change)="selectSpace($event)">
              <option value="" [selected]="!organization()">Personal space</option>
              @for (org of auth.organizations(); track org.id) {
                <option [value]="org.id" [selected]="auth.spaceId() === 'org:' + org.id">{{ org.name }}</option>
              }
            </select></label
          >
        </div>
        <div class="account-actions">
          <details class="workspace-menu">
            <summary>
              <mat-icon>settings</mat-icon><span>Workspace settings</span
              ><mat-icon class="chevron">expand_more</mat-icon>
            </summary>
            <div class="workspace-menu-content">
              <button mat-button type="button" (click)="auth.createOrganization()">
                <mat-icon>add_business</mat-icon>New organization
              </button>
              @if (organization()) {
                <button mat-button type="button" (click)="auth.manageOrganization()">
                  <mat-icon>group</mat-icon>Members & invitations
                </button>
              }
            </div>
          </details>
          <span class="account-divider"></span><span class="avatar" [title]="auth.name()">{{ initials() }}</span
          ><span class="account-name">{{ auth.name() }}</span
          ><button mat-button class="sign-out" type="button" (click)="auth.signOut()">Sign out</button>
        </div>
      } @else {
        <span class="guest-label"
          ><span class="guest-dot"></span>Guest space<span class="guest-description"
            >A quick check, no account needed</span
          ></span
        >
        @if (auth.configured()) {
          <div class="guest-actions">
            <button mat-button type="button" (click)="auth.signIn()">Sign in</button
            ><button mat-flat-button type="button" (click)="auth.signUp()">Sign up</button>
          </div>
        }
      }
    </div>
    @if (auth.error()) {
      <div class="account-notice" role="status"><mat-icon>info_outline</mat-icon>{{ auth.error() }}</div>
    }
  `,
  styles: `
    :host {
      display: block;
      background: #f6f8fc;
      border-bottom: 1px solid #e8edf5;
      color: #586d87;
    }
    .account-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      width: min(100% - 48px, 1120px);
      min-height: 58px;
      margin: auto;
      font-size: 12px;
    }
    .space-picker {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .space-icon {
      display: grid;
      place-items: center;
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 9px;
      border: 1px solid #dee7f5;
      background: #fff;
      color: #3472cf;
    }
    .space-icon mat-icon {
      width: 19px;
      height: 19px;
      font-size: 19px;
    }
    label {
      display: grid;
      gap: 1px;
      min-width: 0;
    }
    label > span {
      padding-left: 3px;
      color: #65758b;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.7px;
      text-transform: uppercase;
    }
    select {
      max-width: 220px;
      padding: 2px 18px 2px 0;
      border: 0;
      background: transparent;
      color: #2b4669;
      font: inherit;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    select:focus-visible,
    summary:focus-visible {
      outline: 2px solid #3977d4;
      outline-offset: 3px;
      border-radius: 4px;
    }
    .account-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .account-name {
      font-size: 11px;
      color: #5f728c;
    }
    .avatar {
      display: grid;
      place-items: center;
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #e2ebfa;
      color: #3768ae;
      font-size: 10px;
      font-weight: 700;
    }
    .account-divider {
      width: 1px;
      height: 22px;
      margin: 0 4px;
      background: #e0e6ef;
    }
    .workspace-menu {
      position: relative;
    }
    summary {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 4px;
      list-style: none;
      color: #65758b;
      cursor: pointer;
      font-size: 11px;
    }
    summary::-webkit-details-marker {
      display: none;
    }
    summary mat-icon {
      width: 16px;
      height: 16px;
      font-size: 16px;
    }
    .chevron {
      color: #9aa9bc;
    }
    .workspace-menu-content {
      position: absolute;
      right: 0;
      top: calc(100% + 8px);
      z-index: 30;
      display: grid;
      gap: 3px;
      min-width: 230px;
      padding: 8px;
      border: 1px solid #dce5f2;
      border-radius: 12px;
      background: #fff;
      box-shadow: 0 12px 30px #1b3e6d1a;
    }
    .workspace-menu-content button {
      justify-content: flex-start;
      border-radius: 7px;
    }
    .guest-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #526b8c;
    }
    .guest-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #7e9ecb;
    }
    .guest-description {
      margin-left: 12px;
      color: #65758b;
      font-size: 11px;
      font-weight: 400;
    }
    .guest-actions {
      display: flex;
      gap: 4px;
      padding: 6px 0;
    }
    .account-notice {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 20px;
      background: #eaf3ff;
      color: #47729f;
      font-size: 12px;
    }
    .account-notice mat-icon {
      width: 16px;
      height: 16px;
      font-size: 16px;
    }
    @media (max-width: 760px) {
      .account-bar {
        width: calc(100% - 28px);
        min-height: 56px;
        gap: 8px;
      }
      .guest-description,
      .account-name,
      .account-divider,
      summary > span,
      summary .chevron {
        display: none;
      }
      .account-actions {
        gap: 3px;
      }
      .space-picker {
        gap: 7px;
      }
      .space-icon {
        width: 28px;
        height: 28px;
      }
      select {
        max-width: 150px;
        font-size: 11px;
      }
      .avatar {
        width: 24px;
        height: 24px;
        font-size: 9px;
      }
      .sign-out {
        min-width: 0;
        padding: 0 8px;
        font-size: 11px;
      }
      summary {
        padding: 8px;
      }
      .guest-actions {
        gap: 0;
      }
    }
  `,
})
export class AccountComponent {
  protected readonly auth = inject(AuthService);
  protected readonly organization = computed(() => this.auth.spaceId()?.startsWith('org:') ?? false);
  protected readonly initials = computed(() =>
    this.auth
      .name()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join(''),
  );
  protected selectSpace(event: Event) {
    if (event.target instanceof HTMLSelectElement) void this.auth.selectSpace(event.target.value);
  }
}
