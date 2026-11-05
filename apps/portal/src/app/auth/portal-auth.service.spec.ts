import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
      create: vi.fn(),
      supportedFirstFactors: [{ strategy: 'email_code', emailAddressId: 'email_123' }],
      prepareFirstFactor: vi.fn(),
      attemptFirstFactor: vi.fn(),
      authenticateWithRedirect: vi.fn(),
    },
    signUp: {
      create: vi.fn(),
      prepareEmailAddressVerification: vi.fn(),
      attemptEmailAddressVerification: vi.fn(),
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
    sdk.client.signIn.create.mockResolvedValue(sdk.client.signIn);
    sdk.client.signUp.create.mockResolvedValue(sdk.client.signUp);
    sdk.client.signUp.status = 'missing_requirements';
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('sends and resends codes to the email factor returned by Clerk', async () => {
    const auth = TestBed.inject(PortalAuthService);
    await auth.sendEmailCode('test@example.com', false);
    await auth.resendEmailCode(false);

    expect(sdk.client.signIn.create).toHaveBeenCalledWith({ identifier: 'test@example.com' });
    expect(sdk.client.signIn.prepareFirstFactor).toHaveBeenCalledTimes(2);
    expect(sdk.client.signIn.prepareFirstFactor).toHaveBeenLastCalledWith({
      strategy: 'email_code',
      emailAddressId: 'email_123',
    });
  });

  it('keeps invalid codes retryable and activates only a completed session', async () => {
    const auth = TestBed.inject(PortalAuthService);
    sdk.client.signIn.attemptFirstFactor.mockRejectedValueOnce(new Error('Incorrect code'));
    await expect(auth.verifyEmailCode('111111', false)).rejects.toThrow('Incorrect code');
    expect(sdk.setActive).not.toHaveBeenCalled();

    sdk.client.signIn.attemptFirstFactor.mockResolvedValueOnce({
      status: 'complete',
      createdSessionId: 'session_123',
    });
    await expect(auth.verifyEmailCode('424242', false)).resolves.toBe(true);
    expect(sdk.setActive).toHaveBeenCalledWith({ session: 'session_123' });
  });

  it('verifies a new email and collects required profile fields before activating', async () => {
    const auth = TestBed.inject(PortalAuthService);
    await auth.sendEmailCode('new@example.com', true);
    expect(sdk.client.signUp.create).toHaveBeenCalledWith({ emailAddress: 'new@example.com' });
    expect(sdk.client.signUp.prepareEmailAddressVerification).toHaveBeenCalledWith({ strategy: 'email_code' });

    sdk.client.signUp.attemptEmailAddressVerification.mockResolvedValueOnce({
      status: 'missing_requirements',
      createdSessionId: null,
    });
    await expect(auth.verifyEmailCode('424242', true)).resolves.toBe(false);
    expect(auth.signUpFields()).toEqual(['username']);
    expect(sdk.setActive).not.toHaveBeenCalled();

    sdk.client.signUp.update.mockResolvedValueOnce({
      status: 'complete',
      createdSessionId: 'session_new',
      missingFields: [],
    });
    await auth.completeSignUp({ username: 'newuser', firstName: '', lastName: '' });
    expect(sdk.client.signUp.update).toHaveBeenCalledWith({ username: 'newuser' });
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
        redirectUrlComplete: '/audits/user-flow',
      });
      await auth.completeRedirect();
      expect(sdk.handleRedirectCallback).toHaveBeenCalledWith(
        expect.objectContaining({ signInUrl: '/sign-in', signUpUrl: '/sign-up', continueSignUpUrl: '/sign-up' }),
      );
    },
  );
});
