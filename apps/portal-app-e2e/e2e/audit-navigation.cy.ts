const createMockEventSource = () => {
  return class MockEventSource {
    url: string;
    readyState = 1;
    private listeners: Record<string, Array<(event: MessageEvent) => void>> = {};

    constructor(url: string) {
      this.url = url;
      setTimeout(() => {
        this.emit('result', { status: 'SUCCESS' });
      }, 0);
    }

    addEventListener(type: string, callback: (event: MessageEvent) => void) {
      this.listeners[type] ??= [];
      this.listeners[type].push(callback);
    }

    removeEventListener(type: string, callback: (event: MessageEvent) => void) {
      this.listeners[type] = (this.listeners[type] ?? []).filter((handler) => handler !== callback);
    }

    close() {
      this.readyState = 2;
    }

    private emit(type: string, data: unknown) {
      const event = { data: JSON.stringify(data) } as MessageEvent;
      (this.listeners[type] ?? []).forEach((handler) => handler(event));
    }
  };
};

describe('audit builder navigation (mock backend)', () => {
  it('navigates to viewer with auditId and renders summary', () => {
    const auditId = 'audit-smoke-123';

    cy.intercept('POST', '/api/audit/schedule', {
      statusCode: 200,
      body: {
        auditId,
        auditQueuePosition: 1,
      },
    }).as('schedule');

    cy.fixture('flow-result.json').then((flowResult) => {
      cy.intercept('GET', `/api/audit/${auditId}/result`, {
        statusCode: 200,
        body: {
          status: 'SUCCESS',
          result: flowResult,
        },
      }).as('result');
    });

    cy.visit('/user-flow', {
      onBeforeLoad(win) {
        win.EventSource = createMockEventSource();
      },
    });

    cy.get('input[placeholder="Audit Title"]').clear().type('Smoke Audit');

    cy.get('ui-audit-builder-step')
      .first()
      .within(() => {
        cy.contains('mat-label', 'Name')
          .closest('mat-form-field')
          .find('input')
          .clear()
          .type('Initial Navigation');
      });

    cy.get('ui-audit-builder-step')
      .eq(1)
      .within(() => {
        cy.contains('mat-label', 'Url')
          .closest('mat-form-field')
          .find('input')
          .clear()
          .type('https://example.com');
      });

    cy.get('button.submit-btn').should('be.enabled').click();

    cy.wait('@schedule');
    cy.wait('@result');

    cy.location('pathname').should('eq', '/user-flow/viewer');
    cy.location('search').should('contain', `auditId=${auditId}`);
    cy.get('ui-audit-summary', { timeout: 20000 }).should('be.visible');
  });
});
