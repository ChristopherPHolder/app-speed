describe('audit runs page', () => {
  it('renders history, paginates, and opens runs through the canonical result route', () => {
    cy.intercept('GET', /\/api\/audit\/runs(\?.*)?$/, (req) => {
      const cursor = req.query.cursor as string | undefined;

      if (cursor === 'cursor-2') {
        req.reply({
          statusCode: 200,
          body: {
            items: [
              {
                auditId: 'audit-running',
                title: 'Running audit',
                status: 'IN_PROGRESS',
                resultStatus: null,
                queuePosition: null,
                createdAt: '2026-03-03T10:01:00.000Z',
                startedAt: '2026-03-03T10:02:00.000Z',
                completedAt: null,
                durationMs: null,
              },
            ],
            nextCursor: null,
            limit: 25,
          },
        });
        return;
      }

      req.reply({
        statusCode: 200,
        body: {
          items: [
            {
              auditId: 'audit-complete',
              title: 'Completed audit',
              status: 'COMPLETE',
              resultStatus: 'SUCCESS',
              queuePosition: null,
              createdAt: '2026-03-03T10:00:00.000Z',
              startedAt: '2026-03-03T10:00:30.000Z',
              completedAt: '2026-03-03T10:01:30.000Z',
              durationMs: 60000,
            },
          ],
          nextCursor: 'cursor-2',
          limit: 25,
        },
      });
    }).as('listRuns');

    cy.intercept('GET', '/api/audit/runs/audit-running/details', {
      statusCode: 200,
      body: {
        auditId: 'audit-running',
        audit: {
          title: 'Running audit',
          url: 'https://example.com',
          timeout: 30,
          steps: [],
        },
        status: 'IN_PROGRESS',
        resultStatus: null,
        queuePosition: null,
        createdAt: '2026-03-03T10:01:00.000Z',
        startedAt: '2026-03-03T10:02:00.000Z',
        completedAt: null,
        durationMs: null,
      },
    }).as('runDetails');

    cy.intercept('GET', '/api/audit/runs/audit-complete/details', {
      statusCode: 200,
      body: {
        auditId: 'audit-complete',
        audit: {
          title: 'Completed audit',
          url: 'https://example.com',
          timeout: 30,
          steps: [],
        },
        status: 'COMPLETE',
        resultStatus: null,
        queuePosition: null,
        createdAt: '2026-03-03T10:00:00.000Z',
        startedAt: '2026-03-03T10:00:30.000Z',
        completedAt: '2026-03-03T10:01:30.000Z',
        durationMs: 60000,
      },
    }).as('completedRunDetails');

    cy.visit('/user-flow/results');

    cy.location('pathname').should('eq', '/user-flow/results/history');
    cy.wait('@listRuns');
    cy.contains('td', 'Completed audit').should('be.visible').click();
    cy.location('pathname').should('eq', '/user-flow/results/audit-complete');
    cy.wait('@completedRunDetails');

    cy.visit('/user-flow/results/history');
    cy.wait('@listRuns');
    cy.contains('button', 'Refresh').click();
    cy.wait('@listRuns');

    cy.contains('button', 'Next').click();
    cy.wait('@listRuns');
    cy.contains('td', 'Running audit').click();

    cy.location('pathname').should('eq', '/user-flow/results/audit-running');
    cy.wait('@runDetails');
  });
});
