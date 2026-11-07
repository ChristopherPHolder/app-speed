import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  NgZone,
  ElementRef,
  afterRenderEffect,
  viewChild,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormField, applyWhen, email, form, pattern, required } from '@angular/forms/signals';
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
        } @else if (step() === 'code') {
          <p>Enter the verification code sent to {{ model().email || 'your email address' }}.</p>
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
          @if (step() === 'email') {
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
            <div class="divider"><span>or continue with email</span></div>
            <form (submit)="sendCode($event)">
              <mat-form-field appearance="outline">
                <mat-label>Email address</mat-label>
                <input matInput type="email" autocomplete="email" [formField]="emailForm.email" />
                <mat-error>Enter a valid email address.</mat-error>
              </mat-form-field>
              <button matButton="filled" type="submit" [disabled]="unavailable() || emailForm().invalid()">
                Send verification code
              </button>
            </form>
          } @else if (step() === 'code') {
            <form (submit)="verifyCode($event)">
              <mat-form-field appearance="outline">
                <mat-label>Verification code</mat-label>
                <input
                  #codeInput
                  matInput
                  type="text"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                  [formField]="codeForm.code"
                />
                <mat-error>Enter the six-digit code from your email.</mat-error>
              </mat-form-field>
              <button matButton="filled" type="submit" [disabled]="unavailable() || codeForm().invalid()">
                Verify and continue
              </button>
            </form>
            <div class="secondary-actions">
              <button
                matButton
                type="button"
                [disabled]="unavailable() || resendRemaining() > 0"
                (click)="resendCode()"
              >
                {{ resendRemaining() > 0 ? 'Resend code in ' + resendRemaining() + 's' : 'Resend code' }}
              </button>
              <button matButton type="button" [disabled]="busy()" (click)="changeEmail()">Change email</button>
            </div>
          } @else {
            @if (requiresOtherFields()) {
              <p role="status">
                Your account needs additional information that isn't supported by email-code sign-up. Choose a social
                sign-in method or contact the app administrator.
              </p>
              <button matButton="outlined" type="button" (click)="changeEmail()">Choose another method</button>
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
    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 24px;
    }
    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }
    .divider span {
      font: var(--mat-sys-label-medium);
      color: var(--mat-sys-on-surface-variant);
    }
    mat-form-field {
      width: 100%;
    }
    .secondary-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      margin-top: 12px;
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
export class AuthPageComponent implements OnDestroy {
  protected readonly auth = inject(PortalAuthService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly route = inject(ActivatedRoute);
  protected readonly signingUp = this.route.snapshot.data['signingUp'] === true;
  protected readonly callback = this.route.snapshot.data['callback'] === true;
  protected readonly step = signal<'email' | 'code' | 'details'>('email');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly notice = signal('');
  protected readonly resendRemaining = signal(0);
  protected readonly model = signal({ email: '', code: '', username: '', firstName: '', lastName: '' });
  protected readonly emailForm = form(this.model, (fields) => {
    required(fields.email);
    email(fields.email);
  });
  protected readonly codeForm = form(this.model, (fields) => {
    required(fields.code);
    pattern(fields.code, /^\d{6}$/);
  });
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
    if (this.step() === 'code') return 'Check your email';
    if (this.step() === 'details') return 'Complete your profile';
    return this.signingUp ? 'Create your account' : 'Sign in to App Speed';
  });

  private readonly codeInput = viewChild<ElementRef<HTMLInputElement>>('codeInput');

  constructor() {
    afterRenderEffect(() => this.codeInput()?.nativeElement.focus());
    afterNextRender(() => {
      void this.perform(async () => {
        if (this.callback) {
          await this.auth.completeRedirect();
        } else if (await this.auth.hasSession()) {
          await this.router.navigateByUrl('/workspaces');
        } else if (this.signingUp) {
          this.step.set(await this.auth.resumeSignUp());
          if (this.step() === 'code') this.startResendCooldown();
        }
        if (this.route.snapshot.queryParamMap.has('verification')) {
          this.error.set(
            'This account requires an additional verification method. Please contact the app administrator.',
          );
        }
      });
    });
  }

  protected sendCode(event: Event): void {
    event.preventDefault();
    if (this.emailForm().invalid()) return;
    void this.perform(async () => {
      await this.auth.sendEmailCode(this.model().email.trim(), this.signingUp);
      this.step.set('code');
      this.startResendCooldown();
    });
  }

  protected verifyCode(event: Event): void {
    event.preventDefault();
    if (this.codeForm().invalid()) return;
    void this.perform(async () => {
      const complete = await this.auth.verifyEmailCode(this.model().code, this.signingUp);
      if (complete) {
        await this.router.navigateByUrl('/workspaces');
      } else {
        this.step.set('details');
      }
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

  protected resendCode(): void {
    if (this.resendRemaining() > 0) return;
    void this.perform(async () => {
      await this.auth.resendEmailCode(this.signingUp);
      this.notice.set('A new verification code has been sent.');
      this.startResendCooldown();
    });
  }

  protected changeEmail(): void {
    clearInterval(this.cooldown);
    this.step.set('email');
    this.model.update((value) => ({ ...value, code: '' }));
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

  private startResendCooldown(): void {
    clearInterval(this.cooldown);
    this.resendRemaining.set(30);
    this.zone.runOutsideAngular(() => {
      this.cooldown = setInterval(() => {
        this.resendRemaining.update((remaining) => Math.max(0, remaining - 1));
        if (this.resendRemaining() === 0) clearInterval(this.cooldown);
      }, 1000);
    });
  }

  private cooldown?: ReturnType<typeof setInterval>;

  ngOnDestroy(): void {
    clearInterval(this.cooldown);
  }
}
