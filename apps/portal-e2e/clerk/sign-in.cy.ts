import { setupClerkTestingToken } from '@clerk/testing/cypress';

// No application auth replacement and no intercepted API responses in this suite.
describe('live Clerk sign-in', () => {
  it('uses the custom email-code form, verifies server identity, persists the session and signs out', () => {
    cy.task<string>('createClerkTestUser').then((email) => {
      setupClerkTestingToken();
      cy.viewport(1440, 1000);
      cy.visit('/sign-in');
      cy.contains('button', 'Reject analytics').click();
      cy.screenshot('clerk/01-sign-in', { capture: 'fullPage' });
      cy.contains('mat-label', 'Email address').click();
      cy.get('input[type="email"]').type(email);
      cy.contains('button', 'Send verification code').should('be.enabled').click();
      cy.contains('h1', 'Check your email').should('be.visible');
      cy.screenshot('clerk/02-verification-code', { capture: 'fullPage', blackout: ['.auth-card p'] });
      cy.get('input[autocomplete="one-time-code"]').type('424242');
      cy.intercept('POST', '**/client/sign_ins/*/attempt_first_factor*').as('verifyCode');
      cy.contains('button', 'Verify and continue').click();
      cy.wait('@verifyCode', { responseTimeout: 30000 }).then(({ response }) => {
        expect(response?.statusCode).to.equal(200);
        expect(response?.body?.response?.status).to.equal('complete');
        const session = response?.body?.client?.sessions?.[0];
        expect(
          { status: session?.status, tasks: (session?.tasks ?? []).map((task: { key?: string }) => task.key) },
          'Clerk session requirements',
        ).to.deep.equal({ status: 'active', tasks: [] });
      });
      cy.location('pathname', { timeout: 20000 }).should('eq', '/public');
      cy.get('app-workspace-switcher').should('exist');
      cy.visit('/workspaces/join');
      cy.contains('mat-card-subtitle', email).should('be.visible');
      cy.screenshot('clerk/03-authenticated-account', { capture: 'fullPage', blackout: ['mat-card-subtitle'] });
      cy.reload();
      cy.contains('mat-card-subtitle', email).should('be.visible');
      cy.get('[aria-label="Open account menu"]').filter(':visible').click();
      cy.contains('button', 'Sign out').click();
      cy.visit('/workspaces/join');
      cy.location('pathname').should('eq', '/sign-in');
      cy.request({ url: '/api/workspaces', failOnStatusCode: false }).its('status').should('eq', 401);
    });
  });
  it('creates an account through the custom sign-up form and completes required profile fields', () => {
    cy.task<{ email: string; username: string }>('newClerkTestAccount').then((account) => {
      setupClerkTestingToken();
      cy.viewport(1440, 1000);
      cy.visit('/sign-up');
      cy.contains('button', 'Reject analytics').click();
      cy.screenshot('clerk/04-sign-up', { capture: 'fullPage' });
      cy.contains('mat-label', 'Email address').click();
      cy.get('input[type="email"]').type(account.email);
      cy.contains('button', 'Send verification code').click();
      cy.contains('h1', 'Check your email').should('be.visible');
      cy.get('input[autocomplete="one-time-code"]').type('424242');
      cy.intercept('POST', '**/client/sign_ups/*/attempt_verification*').as('verifySignUp');
      cy.contains('button', 'Verify and continue').click();
      cy.wait('@verifySignUp').then(({ response }) => {
        const missing: string[] = response?.body?.response?.missing_fields ?? [];
        expect(
          missing.filter((field) => !['username', 'first_name', 'last_name'].includes(field)),
          'Unsupported required Clerk sign-up fields',
        ).to.deep.equal([]);
      });
      cy.contains('h1', 'Complete your profile').should('be.visible');
      cy.get('input[autocomplete="username"]').type(account.username);
      cy.screenshot('clerk/05-required-profile', { capture: 'fullPage', blackout: ['input'] });
      cy.contains('button', 'Create account').click();
      cy.location('pathname').should('eq', '/public');
      cy.visit('/workspaces/join');
      cy.contains('mat-card-subtitle', account.email).should('be.visible');
    });
  });
});
