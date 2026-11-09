import { ChangeDetectionStrategy, Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { FormField, applyWhen, form, pattern, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressBar } from '@angular/material/progress-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PortalAuthService } from './portal-auth.service';

@Component({
  selector: 'app-auth-page',
  imports: [FormField, MatButton, MatError, MatFormField, MatHint, MatLabel, MatInput, MatProgressBar, RouterLink],
  template: `
    <section class="auth-page" aria-labelledby="auth-title">
      <div class="auth-card" [attr.aria-busy]="busy()">
        <p class="eyebrow">YOUR APP SPEED ACCOUNT</p>
        <h1 id="auth-title">{{ title() }}</h1>
        @if (callback) {
          <p>Finishing your sign-in…</p>
        } @else if (step() === 'details') {
          <p>Add a few details to finish creating your account.</p>
        } @else {
          <p>
            {{
              signingUp ? 'Create an account to get started.' : 'Welcome back. Choose how you would like to sign in.'
            }}
          </p>
        }

        @if (busy() || auth.availability() === 'loading') {
          <mat-progress-bar mode="indeterminate" aria-label="Loading authentication" />
        }

        @if (auth.availability() === 'unavailable') {
          <p class="error-message" role="alert">Sign-in is unavailable right now. Please try again later.</p>
        }
        @if (error()) {
          <p class="error-message" role="alert">{{ error() }}</p>
        }
        @if (notice()) {
          <p role="status">{{ notice() }}</p>
        }

        @if (!callback) {
          @if (step() === 'providers') {
            <div class="providers">
              <button matButton="outlined" type="button" [disabled]="unavailable()" (click)="provider('oauth_google')">
                <img src="assets/google.svg" alt="" />
                Continue with Google
              </button>
              <button matButton="outlined" type="button" [disabled]="unavailable()" (click)="provider('oauth_github')">
                <img src="assets/GitHub_Invertocat_Black.svg" alt="" />
                Continue with GitHub
              </button>
            </div>
          } @else {
            @if (requiresOtherFields()) {
              <p role="status">
                Your account needs an additional verification method. Contact the app administrator to finish signing
                in.
              </p>
              <button matButton="outlined" type="button" (click)="chooseProvider()">Choose another method</button>
            } @else {
              <form (submit)="finishSignUp($event)">
                @if (auth.signUpFields().includes('username')) {
                  <mat-form-field appearance="outline">
                    <mat-label>Username</mat-label>
                    <input
                      matInput
                      autocomplete="username"
                      autocapitalize="none"
                      spellcheck="false"
                      [formField]="detailsForm.username"
                    />
                    <mat-hint>Use letters, numbers, - or _; no spaces. For example, christopherholder.</mat-hint>
                    <mat-error>Use letters, numbers, - or _ with no spaces.</mat-error>
                  </mat-form-field>
                }
                @if (auth.signUpFields().includes('first_name')) {
                  <mat-form-field appearance="outline">
                    <mat-label>First name</mat-label>
                    <input matInput autocomplete="given-name" [formField]="detailsForm.firstName" />
                  </mat-form-field>
                }
                @if (auth.signUpFields().includes('last_name')) {
                  <mat-form-field appearance="outline">
                    <mat-label>Last name</mat-label>
                    <input matInput autocomplete="family-name" [formField]="detailsForm.lastName" />
                  </mat-form-field>
                }
                <button matButton="filled" type="submit" [disabled]="unavailable() || detailsForm().invalid()">
                  Create account
                </button>
              </form>
            }
          }
          <div id="clerk-captcha"></div>
          <p class="switch-flow">
            {{ signingUp ? 'Already have an account?' : 'New to App Speed?' }}
            <a [routerLink]="signingUp ? '/sign-in' : '/sign-up'">{{ signingUp ? 'Sign in' : 'Create an account' }}</a>
          </p>
        } @else if (error()) {
          <a matButton="outlined" routerLink="/sign-in">Return to sign in</a>
        }
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
    .auth-page {
      display: grid;
      padding: 48px 20px;
      min-height: 60dvh;
      align-items: start;
      justify-items: center;
      background: var(--mat-sys-surface-container-low);
    }
    .auth-card {
      box-sizing: border-box;
      width: min(100%, 440px);
      padding: 32px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 24px;
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
    }
    .eyebrow {
      color: var(--mat-sys-primary);
      font: var(--mat-sys-label-medium);
      letter-spacing: 0.08em;
    }
    h1 {
      margin: 12px 0;
      font: var(--mat-sys-headline-medium);
    }
    p {
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }
    mat-progress-bar {
      margin: 16px 0;
    }
    .providers,
    form {
      display: grid;
      gap: 12px;
      margin-top: 24px;
    }
    .providers button,
    form > button {
      min-height: 48px;
    }
    .providers img {
      width: 20px;
      height: 20px;
      margin-right: 8px;
      vertical-align: middle;
    }
    mat-form-field {
      width: 100%;
    }
    .error-message {
      color: var(--mat-sys-error);
    }
    .switch-flow {
      margin-top: 28px;
      text-align: center;
    }
    a {
      color: var(--mat-sys-primary);
      text-underline-offset: 3px;
    }
    @media (width < 600px) {
      .auth-page {
        padding: 24px 12px;
      }
      .auth-card {
        padding: 24px 20px;
        border-radius: 20px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPageComponent {
  protected readonly auth = inject(PortalAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly signingUp = this.route.snapshot.data['signingUp'] === true;
  protected readonly callback = this.route.snapshot.data['callback'] === true;
  protected readonly step = signal<'providers' | 'details'>('providers');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly notice = signal('');
  protected readonly model = signal({ username: '', firstName: '', lastName: '' });
  protected readonly detailsForm = form(this.model, (fields) => {
    applyWhen(
      fields.username,
      () => this.auth.signUpFields().includes('username'),
      (username) => {
        required(username);
        pattern(username, /^[a-zA-Z0-9_-]+$/);
      },
    );
    required(fields.firstName, { when: () => this.auth.signUpFields().includes('first_name') });
    required(fields.lastName, { when: () => this.auth.signUpFields().includes('last_name') });
  });
  protected readonly unavailable = computed(() => this.busy() || this.auth.availability() !== 'ready');
  protected readonly requiresOtherFields = computed(() =>
    this.auth.signUpFields().some((field) => !['username', 'first_name', 'last_name'].includes(field)),
  );
  protected readonly title = computed(() => {
    if (this.callback) return 'Signing you in';
    if (this.step() === 'details') return 'Complete your profile';
    return this.signingUp ? 'Create your account' : 'Sign in to App Speed';
  });

  constructor() {
    afterNextRender(() => {
      void this.perform(async () => {
        if (this.callback) {
          await this.auth.completeRedirect();
        } else if (await this.auth.hasSession()) {
          await this.router.navigateByUrl('/workspaces');
        } else if (this.signingUp) {
          this.step.set(await this.auth.resumeSignUp());
        }
        if (this.route.snapshot.queryParamMap.has('verification')) {
          this.error.set(
            'This account requires an additional verification method. Please contact the app administrator.',
          );
        }
      });
    });
  }

  protected finishSignUp(event: Event): void {
    event.preventDefault();
    if (this.detailsForm().invalid()) return;
    void this.perform(async () => {
      await this.auth.completeSignUp(this.model());
      await this.router.navigateByUrl('/workspaces');
    });
  }

  protected provider(strategy: 'oauth_google' | 'oauth_github'): void {
    void this.perform(() => this.auth.signInWithProvider(strategy, this.signingUp));
  }

  protected chooseProvider(): void {
    this.step.set('providers');
    this.error.set('');
    this.notice.set('');
  }

  private async perform(action: () => Promise<unknown>): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.notice.set('');
    try {
      await action();
    } catch (error) {
      this.error.set(await this.auth.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
