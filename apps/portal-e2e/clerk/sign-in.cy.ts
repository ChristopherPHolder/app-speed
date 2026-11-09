import { addClerkCommands, setupClerkTestingToken } from '@clerk/testing/cypress';

addClerkCommands({ Cypress, cy });

// A real Clerk development session verifies the browser → API identity boundary.
// The test helper authenticates without driving an external Google/GitHub account.
describe('live Clerk session', () => {
  it('shows social providers, verifies server identity, persists the session and signs out', () => {
    cy.task<string>('createClerkTestUser').then((email) => {
      setupClerkTestingToken();
      cy.viewport(1440, 1000);
      cy.visit('/sign-in');
      cy.contains('button', 'Reject analytics').click();
      cy.contains('button', 'Continue with Google').should('be.enabled');
      cy.contains('button', 'Continue with GitHub').should('be.enabled');
      cy.get('input[type="email"]').should('not.exist');
      cy.screenshot('clerk/01-social-sign-in', { capture: 'fullPage' });
      cy.clerkSignIn({ strategy: 'email_code', identifier: email });
      cy.window().should((window) => {
        expect(window.Clerk.session?.status, 'Clerk session is active').to.equal('active');
        expect(window.Clerk.session?.currentTask ?? null, 'No pending Clerk session task').to.equal(null);
      });
      cy.visit('/workspaces/join');
      cy.contains('mat-card-subtitle', email).should('be.visible');
      cy.screenshot('clerk/02-authenticated-account', { capture: 'fullPage', blackout: ['mat-card-subtitle'] });
      cy.reload();
      cy.contains('mat-card-subtitle', email).should('be.visible');
      cy.get('[aria-label="Open account menu"]').filter(':visible').click();
      cy.contains('button', 'Sign out').click();
      cy.visit('/workspaces/join');
      cy.location('pathname').should('eq', '/sign-in');
      cy.request({ url: '/api/workspaces', failOnStatusCode: false }).its('status').should('eq', 401);
    });
  });
});
