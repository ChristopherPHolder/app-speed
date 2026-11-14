import type { WorkspaceAction, WorkspaceOverview } from '@app-speed/workspace/domain';

export type TestAccount = 'admin' | 'member' | 'outsider';
export function overview(account: TestAccount = 'admin') {
  return cy
    .request<WorkspaceOverview>({ url: '/api/workspaces', headers: { authorization: `Bearer e2e-${account}` } })
    .its('body');
}
export function action(body: WorkspaceAction, account: TestAccount = 'admin', status = 200) {
  return cy
    .request<{ id: string }>({
      method: 'POST',
      url: '/api/workspaces/actions',
      headers: { authorization: `Bearer e2e-${account}` },
      body,
      failOnStatusCode: false,
    })
    .then((response) => {
      expect(response.status, body.action).to.equal(status);
      return response.body;
    });
}
export function visitAs(path: string, account: TestAccount | '' = 'admin') {
  cy.visit(path, {
    onBeforeLoad(win) {
      if (account) win.localStorage.setItem('e2e-account', account);
      else win.localStorage.removeItem('e2e-account');
      win.localStorage.setItem('app-speed.analytics-consent', 'rejected');
    },
  });
  cy.get('app-shell').should('exist');
  cy.get('body').then((body) => {
    if (body.find('button:contains("Reject analytics")').length) cy.contains('button', 'Reject analytics').click();
  });
}
export function snapshot(viewport: string, name: string) {
  cy.get('mat-progress-bar').should('not.exist');
  cy.document().then(async (doc) => {
    await doc.fonts.ready;
    if (!doc.getElementById('visual-test-style')) {
      const style = doc.createElement('style');
      style.id = 'visual-test-style';
      style.textContent =
        '*,*::before,*::after { animation: none !important; transition: none !important; caret-color: transparent !important; }';
      doc.head.append(style);
    }
  });
  // CSS can finish before Material's animation-completion callbacks remove overlays.
  // Require dialogs to reach their open state, and closing menus to detach, before capture.
  cy.get('body').then((body) => {
    if (body.find('mat-dialog-container').length) {
      cy.get('mat-dialog-container')
        .should('have.class', 'mdc-dialog--open')
        .and('not.have.class', 'mdc-dialog--opening');
    }
  });
  cy.get('.mat-menu-panel-exit-animation, .mat-menu-panel-animating, .mdc-dialog--closing').should('not.exist');
  cy.window().then((win) =>
    expect(win.document.documentElement.scrollWidth, 'no horizontal overflow').to.be.at.most(win.innerWidth),
  );
  cy.screenshot(`workspace/${viewport}/${name}`, {
    capture: 'fullPage',
    overwrite: true,
    blackout: ['[aria-label="Pending invitations"] [matlistitemline]'],
  });
}
export function submitName(name: string) {
  cy.get('mat-dialog-container input').clear();
  cy.get('mat-dialog-container input').type(name);
  cy.get('mat-dialog-container form').submit();
  cy.get('mat-dialog-container').should('not.exist');
}
export function openNavigation() {
  cy.window().then((win) => {
    if (win.innerWidth < 840) {
      cy.get('[aria-label="Open navigation menu"]')
        .should('be.visible')
        .should('have.attr', 'aria-expanded', 'false')
        .click();
      cy.get('mat-sidenav').should('have.class', 'mat-drawer-opened');
    }
  });
}
export function confirm(label: string) {
  cy.get('mat-dialog-container').should('be.visible');
  cy.get('mat-dialog-container').contains('button', label).click();
  cy.get('mat-dialog-container').should('not.exist');
}
