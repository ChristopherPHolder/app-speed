import { bootstrapApplication } from '@angular/platform-browser';
import { inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { PortalAuthService } from './app/auth/portal-auth.service';

// This provider is compiled only into the dedicated browser-test build.
function testAuth() {
  const router = inject(Router);
  const account = localStorage.getItem('e2e-account') ?? '';
  const signedIn = signal(!!account);
  const unavailable = () => Promise.reject(new Error('Use the live Clerk suite for authentication UI.'));
  return {
    signedIn: signedIn.asReadonly(),
    availability: signal('ready'),
    accountLabel: signal(
      account === 'member' ? 'pat@example.com' : account === 'outsider' ? 'alex@example.com' : 'chris@example.com',
    ),
    accountImageUrl: signal(''),
    signUpFields: signal<ReadonlyArray<string>>([]),
    hasSession: async () => signedIn(),
    sessionToken: async () => (signedIn() ? `e2e-${account}` : ''),
    openSignIn: () => void router.navigateByUrl('/sign-in'),
    signOut: async () => {
      localStorage.removeItem('e2e-account');
      signedIn.set(false);
      await router.navigateByUrl('/');
    },
    errorMessage: async (error: unknown) => (error instanceof Error ? error.message : 'Sign-in failed.'),
    completeSignUp: unavailable,
    resumeSignUp: unavailable,
    signInWithProvider: unavailable,
    completeRedirect: unavailable,
  };
}
bootstrapApplication(AppComponent, {
  providers: [...appConfig.providers, { provide: PortalAuthService, useFactory: testAuth }],
}).catch((error) => console.error(error));
