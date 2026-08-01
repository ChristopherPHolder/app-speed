import { getAuditBuilder } from '../support/app.po';

const waitForBackend = (attempts = 30): Cypress.Chainable => {
  return cy
    .request({
      url: 'http://localhost:3000/api/health',
      failOnStatusCode: false,
    })
    .then((response) => {
      if (response.status === 200) return;
      if (attempts <= 1) {
        throw new Error('Backend not ready on http://localhost:3000');
      }
      return Cypress.Promise.delay(1000).then(() => waitForBackend(attempts - 1));
    });
};

const waitForAuditResult = (auditId: string, attempts = 120): Cypress.Chainable => {
  return cy
    .request({
      url: `/api/audits/user-flow/${auditId}/result`,
      failOnStatusCode: false,
    })
    .then((response) => {
      if (response.status === 200 && response.body?.status === 'SUCCESS') return response;
      if (response.status === 200 && response.body?.status === 'FAILURE') {
        throw new Error(`Audit failed for ${auditId}: ${JSON.stringify(response.body)}`);
      }
      if (attempts <= 1) {
        throw new Error(`Audit result not ready for ${auditId}`);
      }
      // The result endpoint is polled with a deliberate backoff while the real runner executes the audit.
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      return cy.wait(5000).then(() => waitForAuditResult(auditId, attempts - 1));
    });
};

describe('portal', () => {
  beforeEach(() => cy.visit('/audits/user-flow'));

  it('should show the audit builder', () => {
    getAuditBuilder().should('be.visible');
  });

  it('runs a real user-flow audit to completion', function () {
    this.timeout(12 * 60_000);
    waitForBackend();
    cy.intercept('POST', '/api/audits/user-flow/schedule').as('schedule');

    cy.get('input[placeholder="Audit Title"]').clear();
    cy.get('input[placeholder="Audit Title"]').type('e2e');

    cy.get('ui-audit-builder-step')
      .first()
      .within(() => {
        cy.contains('mat-label', 'Name').closest('mat-form-field').find('input').as('nameInput');
        cy.get('@nameInput').clear();
        cy.get('@nameInput').type('Initial Navigation');
      });

    cy.get('ui-audit-builder-step')
      .eq(1)
      .within(() => {
        cy.contains('mat-label', 'Url').closest('mat-form-field').find('input').as('urlInput');
        cy.get('@urlInput').clear();
        cy.get('@urlInput').type('https://deep-blue.io');
      });

    cy.get('button.submit-btn').should('be.enabled').click();

    cy.wait('@schedule', { timeout: 20000 }).then(({ request, response }) => {
      expect(request.body?.title).to.equal('e2e');
      expect(request.body?.steps?.[1]?.url).to.equal('https://deep-blue.io');
      expect(response?.statusCode).to.equal(200);
      expect(response?.body?.auditId).to.be.a('string');
      return waitForAuditResult(response?.body?.auditId).then((result) => {
        expect(result.body?.status).to.equal('SUCCESS');
      });
    });

    cy.location('pathname', { timeout: 30_000 }).should('match', /^\/audits\/user-flow\/[0-9a-f-]+$/);
    cy.get('ui-audit-summary', { timeout: 30_000 }).should('be.visible');
  });
});
