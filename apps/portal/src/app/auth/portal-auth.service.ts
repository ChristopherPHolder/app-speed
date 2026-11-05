import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { Clerk } from '@clerk/clerk-js';

declare const PORTAL_CLERK_PUBLISHABLE_KEY: string;

@Injectable({ providedIn: 'root' })
export class PortalAuthService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly sessionActive = signal(false);
  private readonly status = signal<'loading' | 'ready' | 'unavailable'>('loading');
  private readonly userLabel = signal('');
  private readonly userImageUrl = signal('');
  private readonly requiredFields = signal<ReadonlyArray<string>>([]);
  readonly signedIn = this.sessionActive.asReadonly();
  readonly availability = this.status.asReadonly();
  readonly accountLabel = this.userLabel.asReadonly();
  readonly accountImageUrl = this.userImageUrl.asReadonly();
  readonly signUpFields = this.requiredFields.asReadonly();
  private readonly ready: Promise<Clerk | undefined>;

  constructor() {
    const key = typeof PORTAL_CLERK_PUBLISHABLE_KEY === 'undefined' ? '' : PORTAL_CLERK_PUBLISHABLE_KEY;
    this.ready = this.initialize(key);
  }

  openSignIn(): void {
    void this.router.navigateByUrl('/sign-in');
  }

  async hasSession(): Promise<boolean> {
    await this.ready;
    return this.signedIn();
  }

  async sendEmailCode(email: string, signingUp: boolean): Promise<void> {
    const { client } = await this.getClerk();
    if (signingUp) {
      const signUp = await client.signUp.create({ emailAddress: email });
      this.requiredFields.set(signUp.missingFields.filter((field) => field !== 'email_address'));
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    } else {
      const signIn = await client.signIn.create({ identifier: email });
      const factor = signIn.supportedFirstFactors?.find((item) => item.strategy === 'email_code');
      if (!factor || factor.strategy !== 'email_code') {
        return Promise.reject(new Error('Email-code sign-in is unavailable for this account. Try Google or GitHub.'));
      }
      await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: factor.emailAddressId });
    }
  }

  async resendEmailCode(signingUp: boolean): Promise<void> {
    const { client } = await this.getClerk();
    if (signingUp) {
      await client.signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    } else {
      const factor = client.signIn.supportedFirstFactors?.find((item) => item.strategy === 'email_code');
      if (!factor || factor.strategy !== 'email_code') {
        return Promise.reject(new Error('The email-code attempt has expired. Please start again.'));
      }
      await client.signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: factor.emailAddressId });
    }
  }

  async verifyEmailCode(code: string, signingUp: boolean): Promise<boolean> {
    const { clerk, client } = await this.getClerk();
    const attempt = signingUp
      ? await client.signUp.attemptEmailAddressVerification({ code })
      : await client.signIn.attemptFirstFactor({ strategy: 'email_code', code });
    if (attempt.status === 'complete' && attempt.createdSessionId) {
      await clerk.setActive({ session: attempt.createdSessionId });
      return true;
    }
    if (signingUp && client.signUp.status === 'missing_requirements') {
      this.requiredFields.set(client.signUp.missingFields);
      return false;
    }
    return Promise.reject(
      new Error('This account requires another verification method. Use Google or GitHub to continue.'),
    );
  }

  async completeSignUp(details: { username: string; firstName: string; lastName: string }): Promise<void> {
    const { clerk, client } = await this.getClerk();
    const attempt = await client.signUp.update({
      ...(this.signUpFields().includes('username') ? { username: details.username } : {}),
      ...(this.signUpFields().includes('first_name') ? { firstName: details.firstName } : {}),
      ...(this.signUpFields().includes('last_name') ? { lastName: details.lastName } : {}),
    });
    this.requiredFields.set(attempt.missingFields);
    if (attempt.status === 'complete' && attempt.createdSessionId) {
      await clerk.setActive({ session: attempt.createdSessionId });
      return;
    }
    return Promise.reject(new Error('Your account still needs additional information. Check the fields below.'));
  }

  async resumeSignUp(): Promise<'email' | 'code' | 'details'> {
    const { client } = await this.getClerk();
    const signUp = client.signUp;
    if (signUp.status !== 'missing_requirements') return 'email';
    this.requiredFields.set(signUp.missingFields);
    if (signUp.unverifiedFields.includes('email_address')) {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      return 'code';
    }
    return 'details';
  }

  async signInWithProvider(strategy: 'oauth_google' | 'oauth_github', signingUp: boolean): Promise<void> {
    const { client } = await this.getClerk();
    const attempt = signingUp ? client.signUp : client.signIn;
    await attempt.authenticateWithRedirect({
      strategy,
      redirectUrl: '/auth/callback',
      redirectUrlComplete: '/audits/user-flow',
    });
  }

  async completeRedirect(): Promise<void> {
    const { clerk } = await this.getClerk();
    await clerk.handleRedirectCallback({
      signInUrl: '/sign-in',
      signUpUrl: '/sign-up',
      continueSignUpUrl: '/sign-up',
      firstFactorUrl: '/sign-in',
      secondFactorUrl: '/sign-in?verification=required',
      signInFallbackRedirectUrl: '/audits/user-flow',
      signUpFallbackRedirectUrl: '/audits/user-flow',
    });
  }

  async signOut(): Promise<void> {
    const { clerk } = await this.getClerk();
    await clerk.signOut();
    await this.router.navigateByUrl('/');
  }

  async errorMessage(error: unknown): Promise<string> {
    const { isClerkAPIResponseError } = await import('@clerk/clerk-js');
    if (isClerkAPIResponseError(error)) {
      return error.errors[0]?.longMessage ?? error.errors[0]?.message ?? 'Authentication failed. Please try again.';
    }
    return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  }

  private async getClerk() {
    const clerk = await this.ready;
    if (clerk?.client) return { clerk, client: clerk.client };
    return Promise.reject(new Error('Sign-in is unavailable right now. Please try again later.'));
  }

  private async initialize(key: string): Promise<Clerk | undefined> {
    if (!key) {
      this.status.set('unavailable');
      return;
    }

    try {
      const { Clerk } = await import('@clerk/clerk-js');
      const clerk = new Clerk(key);
      await clerk.load({ signInUrl: '/sign-in', signUpUrl: '/sign-up' });
      if (this.destroyRef.destroyed) return;

      const updateSession = () => {
        this.sessionActive.set(clerk.isSignedIn === true);
        this.userImageUrl.set(clerk.isSignedIn && clerk.user?.hasImage ? clerk.user.imageUrl : '');
        this.userLabel.set(clerk.user?.primaryEmailAddress?.emailAddress ?? clerk.user?.fullName ?? 'Your account');
      };
      updateSession();
      const unsubscribe = clerk.addListener(updateSession);
      this.destroyRef.onDestroy(unsubscribe);
      this.status.set('ready');
      return clerk;
    } catch {
      this.status.set('unavailable');
      return;
    }
  }
}
