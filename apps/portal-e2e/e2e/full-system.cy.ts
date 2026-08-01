const auditTitle = 'Deterministic fixture audit';

const auditDraft = (fixtureBaseUrl: string) => ({
  title: 'Draft fixture audit',
  device: 'mobile',
  timeout: 30_000,
  steps: [
    { type: 'customStep', step: 'startNavigation', name: 'Fixture navigation' },
    { type: 'navigate', url: fixtureBaseUrl },
    {
      type: 'click',
      offsetX: 50,
      offsetY: 20,
      selectors: [{ segments: ['#reveal-result'] }],
    },
    {
      type: 'waitForElement',
      count: 1,
      selectors: [{ segments: ['#fixture-state.ready'] }],
      visible: true,
    },
    { type: 'customStep', step: 'endNavigation' },
  ],
});

describe('full local audit system', () => {
  it('runs, persists, and reopens a real user-flow audit', function () {
    this.timeout(300_000);
    const fixtureBaseUrl = Cypress.env('fixtureBaseUrl');
    expect(fixtureBaseUrl).to.be.a('string');

    cy.intercept('POST', '/api/audits/user-flow/schedule').as('scheduleAudit');
    cy.intercept('GET', /\/api\/audits\/user-flow\/[0-9a-f-]+\/events$/).as('auditEvents');
    cy.intercept('GET', /\/api\/audits\/user-flow\/[0-9a-f-]+\/result$/).as('auditResult');

    const draft = encodeURIComponent(JSON.stringify(auditDraft(fixtureBaseUrl)));
    cy.visit(`/audits/user-flow?audit-details=${draft}`);

    cy.get('[data-testid="audit-builder-card"]').should('be.visible');
    cy.get('input[placeholder="Audit Title"]').clear();
    cy.get('input[placeholder="Audit Title"]').type(auditTitle);
    cy.get('ui-audit-builder-step')
      .eq(1)
      .within(() => {
        cy.contains('mat-label', 'Url').closest('mat-form-field').find('input').as('fixtureUrlInput');
        cy.get('@fixtureUrlInput').clear();
        cy.get('@fixtureUrlInput').type(fixtureBaseUrl);
      });
    cy.get('ui-audit-builder-step').eq(2).should('contain.text', 'Click');
    cy.get('ui-audit-builder-step').eq(3).should('contain.text', 'Wait For Element');

    cy.get('button.submit-btn').should('be.enabled').click();
    cy.wait('@scheduleAudit').then(({ request, response }) => {
      expect(request.body).to.deep.equal({ ...auditDraft(fixtureBaseUrl), title: auditTitle });
      expect(response?.statusCode).to.equal(200);
      expect(response?.body?.auditId).to.be.a('string');
      cy.wrap(response?.body?.auditId).as('auditId');
    });

    cy.get('[data-testid="audit-progress-status"]', { timeout: 30_000 }).should('be.visible');
    cy.wait('@auditResult', { responseTimeout: 240_000 }).its('response.body.status').should('equal', 'SUCCESS');
    cy.get('ui-audit-summary', { timeout: 240_000 }).should('be.visible');
    cy.get('ui-audit-summary .summary-title').should('have.length.greaterThan', 0);
    cy.get('ui-audit-summary .score-container').should('be.visible').and('not.be.empty');
    cy.get('@auditEvents.all').should('have.length.at.least', 1);
    cy.get('@auditResult.all').should('have.length.at.least', 1);

    cy.get<string>('@auditId').then((auditId) => {
      cy.location('pathname').should('eq', `/audits/user-flow/${auditId}`);
      cy.intercept('GET', /\/api\/audits\/user-flow\/history(\?.*)?$/).as('history');
      cy.visit('/audits/user-flow/history');
      cy.wait('@history').its('response.statusCode').should('equal', 200);
      cy.contains('td', auditTitle).should('be.visible').click();
      cy.location('pathname').should('eq', `/audits/user-flow/${auditId}`);
      cy.get('ui-audit-summary', { timeout: 30_000 }).should('be.visible');
    });
  });
});
