import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthPageComponent } from './auth-page.component';
import { PortalAuthService } from './portal-auth.service';
import { signal } from '@angular/core';

describe('Material authentication page', () => {
  const auth = {
    availability: signal('ready'),
    hasSession: vi.fn(),
    signUpFields: signal<ReadonlyArray<string>>([]),
    sendEmailCode: vi.fn(),
    verifyEmailCode: vi.fn(),
    signInWithProvider: vi.fn(),
    resumeSignUp: vi.fn(),
    completeRedirect: vi.fn(),
    completeSignUp: vi.fn(),
    errorMessage: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    auth.signUpFields.set([]);
    auth.hasSession.mockResolvedValue(false);
    auth.resumeSignUp.mockResolvedValue('email');
    auth.errorMessage.mockResolvedValue('Incorrect code. Please try again.');
    TestBed.configureTestingModule({
      imports: [AuthPageComponent],
      providers: [
        { provide: PortalAuthService, useValue: auth },
        provideRouter([
          { path: 'audits/user-flow', children: [] },
          { path: 'sign-in', component: AuthPageComponent },
          { path: 'sign-up', component: AuthPageComponent, data: { signingUp: true } },
          { path: 'auth/callback', component: AuthPageComponent, data: { callback: true } },
        ]),
      ],
    });
  });

  it('renders provider choices and advances email-code sign-in while allowing an invalid-code retry', async () => {
    const fixture = TestBed.createComponent(AuthPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const google = Array.from(element.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Google'),
    );
    expect(google?.disabled).toBe(false);
    google?.click();
    await fixture.whenStable();
    expect(auth.signInWithProvider).toHaveBeenCalledWith('oauth_google', false);

    const email = element.querySelector<HTMLInputElement>('input[type="email"]');
    if (!email) throw new Error('Email field missing');
    email.value = 'test@example.com';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    element.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();

    expect(auth.sendEmailCode).toHaveBeenCalledWith('test@example.com', false);
    expect(element.querySelector('h1')?.textContent).toContain('Check your email');
    const code = element.querySelector<HTMLInputElement>('input[autocomplete="one-time-code"]');
    if (!code) throw new Error('Verification field missing');
    expect(document.activeElement).toBe(code);
    code.value = '111111';
    code.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    auth.verifyEmailCode.mockRejectedValueOnce(new Error('Incorrect code'));
    element.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();

    expect(auth.verifyEmailCode).toHaveBeenCalledWith('111111', false);
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Incorrect code');
    expect(element.querySelector('input[autocomplete="one-time-code"]')).not.toBeNull();
    fixture.destroy();
  });

  it('uses sign-up mode on the account creation route', async () => {
    const harness = await RouterTestingHarness.create('/sign-up');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Create your account');
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(auth.resumeSignUp).toHaveBeenCalled();
  });

  it('blocks usernames with spaces and lets the user correct a rejected username and finish sign-up', async () => {
    auth.signUpFields.set(['username']);
    auth.resumeSignUp.mockResolvedValue('details');
    const harness = await RouterTestingHarness.create('/sign-up');
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    harness.detectChanges();
    const element = harness.routeNativeElement;
    const username = element?.querySelector<HTMLInputElement>('input[autocomplete="username"]');
    if (!element || !username) throw new Error('Username field missing');
    const enterUsername = (value: string) => {
      username.value = value;
      username.dispatchEvent(new Event('input', { bubbles: true }));
      username.dispatchEvent(new Event('blur'));
      harness.detectChanges();
    };
    const submit = async () => {
      element.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await harness.fixture.whenStable();
      harness.detectChanges();
    };

    enterUsername('Christopher Holder');
    expect(element.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    await submit();
    expect(auth.completeSignUp).not.toHaveBeenCalled();
    expect(element.textContent).toContain('no spaces');

    auth.completeSignUp.mockRejectedValueOnce(new Error('Username taken'));
    auth.errorMessage.mockResolvedValueOnce('That username is taken. Try another.');
    enterUsername('christopherholder');
    await submit();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('username is taken');
    expect(element.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false);

    enterUsername('christopherholder2');
    await submit();
    expect(auth.completeSignUp).toHaveBeenLastCalledWith(expect.objectContaining({ username: 'christopherholder2' }));
    expect(TestBed.inject(Router).url).toBe('/audits/user-flow');
  });

  it('handles the OAuth callback without rendering another sign-in form', async () => {
    const harness = await RouterTestingHarness.create('/auth/callback');
    expect(auth.completeRedirect).toHaveBeenCalledOnce();
    expect(harness.routeNativeElement?.querySelector('form')).toBeNull();
  });
});
