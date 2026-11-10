import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { PortalAuthService } from './portal-auth.service';

const sdk = vi.hoisted(() => ({
  load: vi.fn(),
  isSignedIn: false,
  user: undefined,
  addListener: vi.fn(),
  setActive: vi.fn(),
  signOut: vi.fn(),
  handleRedirectCallback: vi.fn(),
  client: {
    signIn: {
      authenticateWithRedirect: vi.fn(),
    },
    signUp: {
      authenticateWithRedirect: vi.fn(),
      update: vi.fn(),
      missingFields: ['username'],
      unverifiedFields: ['email_address'],
      status: 'missing_requirements',
    },
  },
}));

vi.mock('@clerk/clerk-js', () => ({
  Clerk: class {
    constructor() {
      return sdk;
    }
  },
  isClerkAPIResponseError: () => false,
}));

describe('PortalAuthService custom authentication', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('PORTAL_CLERK_PUBLISHABLE_KEY', 'pk_test_portal');
    sdk.addListener.mockReturnValue(() => undefined);
    sdk.client.signUp.status = 'missing_requirements';
    sdk.client.signUp.unverifiedFields = ['email_address'];
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('resumes profile completion after social sign-up and activates only a completed session', async () => {
    const auth = TestBed.inject(PortalAuthService);
    sdk.client.signUp.unverifiedFields = [];
    expect(await auth.resumeSignUp()).toBe('details');
    expect(auth.signUpFields()).toEqual(['username']);
    sdk.client.signUp.update.mockResolvedValueOnce({
      status: 'missing_requirements',
      createdSessionId: null,
      missingFields: ['username'],
    });
    await expect(auth.completeSignUp({ username: 'taken', firstName: '', lastName: '' })).rejects.toThrow(
      'additional information',
    );
    expect(sdk.setActive).not.toHaveBeenCalled();
    sdk.client.signUp.update.mockResolvedValueOnce({
      status: 'complete',
      createdSessionId: 'session_new',
      missingFields: [],
    });
    await auth.completeSignUp({ username: 'newuser', firstName: '', lastName: '' });
    expect(sdk.client.signUp.update).toHaveBeenLastCalledWith({ username: 'newuser' });
    expect(sdk.setActive).toHaveBeenCalledWith({ session: 'session_new' });
  });

  it.each(['oauth_google', 'oauth_github'] satisfies ReadonlyArray<'oauth_google' | 'oauth_github'>)(
    'starts %s with the custom callback route',
    async (strategy) => {
      const auth = TestBed.inject(PortalAuthService);
      await auth.signInWithProvider(strategy, false);
      expect(sdk.client.signIn.authenticateWithRedirect).toHaveBeenCalledWith({
        strategy,
        redirectUrl: '/auth/callback',
        redirectUrlComplete: '/workspaces',
      });
      await auth.signInWithProvider(strategy, true);
      expect(sdk.client.signUp.authenticateWithRedirect).toHaveBeenCalledWith({
        strategy,
        redirectUrl: '/auth/callback',
        redirectUrlComplete: '/workspaces',
      });
      await auth.completeRedirect();
      expect(sdk.handleRedirectCallback).toHaveBeenCalledWith(
        expect.objectContaining({ signInUrl: '/sign-in', signUpUrl: '/sign-up', continueSignUpUrl: '/sign-up' }),
      );
    },
  );
  it('preserves a copied audit URL through OAuth and profile completion routes', async () => {
    const router = TestBed.inject(Router);
    const target = '/audits/user-flow/run-123?projectId=project-a';
    vi.spyOn(router, 'url', 'get').mockReturnValue(
      router.serializeUrl(router.createUrlTree(['/sign-in'], { queryParams: { returnUrl: target } })),
    );
    const auth = TestBed.inject(PortalAuthService);
    await auth.signInWithProvider('oauth_google', false);
    expect(sdk.client.signIn.authenticateWithRedirect).toHaveBeenCalledWith(
      expect.objectContaining({ redirectUrlComplete: target }),
    );
    await auth.completeRedirect();
    expect(sdk.handleRedirectCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        signInFallbackRedirectUrl: target,
        signUpFallbackRedirectUrl: target,
      }),
    );
  });
  it.each(['https://example.com', '//example.com', '/sign-in', '/audits/\\example.com'])(
    'rejects unsafe or unrelated return destination %s',
    (returnUrl) => {
      const router = TestBed.inject(Router);
      vi.spyOn(router, 'url', 'get').mockReturnValue(
        router.serializeUrl(router.createUrlTree(['/sign-in'], { queryParams: { returnUrl } })),
      );
      expect(TestBed.inject(PortalAuthService).returnUrl).toBe('/workspaces');
    },
  );
});
