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

const waitForAuditResult = (auditId: string, attempts = 180): Cypress.Chainable => {
  return cy
    .request({
      url: `/api/audit/${auditId}/result`,
      failOnStatusCode: false,
    })
    .then((response) => {
      if (response.status === 200 && response.body?.status === 'SUCCESS') return response;
      if (attempts <= 1) {
        throw new Error(`Audit result not ready for ${auditId}`);
      }
      return Cypress.Promise.delay(1000).then(() => waitForAuditResult(auditId, attempts - 1));
    });
};

describe('portal', () => {
  beforeEach(() => cy.visit('/'));

  it('should show the audit builder', () => {
    getAuditBuilder().should('be.visible');
  });

  it('should submit an audit', function () {
    this.timeout(180000);
    waitForBackend();
    cy.intercept('POST', '/api/audit/schedule').as('schedule');

    cy.get('input[placeholder="Audit Title"]').clear();
    cy.get('input[placeholder="Audit Title"]').type('E2E Audit');

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
        cy.get('@urlInput').type('https://example.com');
      });

    cy.get('button.submit-btn').should('be.enabled').click();

    cy.wait('@schedule', { timeout: 20000 }).then(({ request, response }) => {
      expect(request.body?.title).to.equal('E2E Audit');
      expect(response?.statusCode).to.equal(200);
      expect(response?.body?.auditId).to.be.a('string');
      return waitForAuditResult(response?.body?.auditId);
    });

    cy.get('ui-audit-summary', { timeout: 20000 }).should('be.visible');
  });
});
