const draft = (url: string) => ({
  title: 'Checkout performance',
  device: 'mobile',
  timeout: 30000,
  steps: [
    { type: 'customStep', step: 'startNavigation', name: 'Open checkout' },
    { type: 'navigate', url },
    { type: 'click', offsetX: 50, offsetY: 20, selectors: [{ segments: ['#reveal-result'] }] },
    { type: 'waitForElement', count: 1, selectors: [{ segments: ['#fixture-state.ready'] }], visible: true },
    { type: 'customStep', step: 'endNavigation' },
  ],
});
const endpoint = '/api/audits/user-flow/manage';
type View = { versions: { id: string; templateId: string }[]; schedules: { id: string; state: string }[] };
const overview = () => cy.request<View>({ method: 'POST', url: endpoint, body: { action: 'list' } });

for (const device of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  describe(`${device.name}: guest, personal, sharing, schedules, organization`, () => {
    it('captures the full application journey with local demo identities', function () {
      this.timeout(600000);
      let runId = '';
      let versionId = '';
      let templateId = '';
      let scheduleId = '';
      let shareUrl = '';
      let version2 = '';
      const screenshot = (step: string) => {
        cy.window().then((win) =>
          expect(win.document.documentElement.scrollWidth, `${step}: no horizontal overflow`).to.be.at.most(
            device.width,
          ),
        );
        cy.window().then((win) => {
          win.document.querySelector<HTMLElement>('.app-header')?.style.setProperty('position', 'static');
          win.document.querySelector<HTMLElement>('.editor')?.style.setProperty('position', 'static');
          win.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        });
        cy.screenshot(`${device.name}/${step}`, {
          capture: 'fullPage',
          overwrite: true,
          onAfterScreenshot(_element, details) {
            expect(details.dimensions.width, `${step}: uncropped PNG width`).to.equal(device.width);
          },
        });
        cy.window().then((win) => {
          win.document.querySelector<HTMLElement>('.app-header')?.style.removeProperty('position');
          win.document.querySelector<HTMLElement>('.editor')?.style.removeProperty('position');
        });
      };
      const saved = () => {
        cy.visit('/audits/saved');
        cy.contains('h1', 'Saved audits & schedules').should('be.visible');
      };
      const signIn = () => {
        cy.get('platform-account')
          .contains('button', /^\s*Sign in\s*$/)
          .click();
        cy.get('platform-account select').should('be.visible');
      };
      cy.task('captureReset');
      cy.viewport(device.width, device.height);
      cy.visit('/');
      cy.contains('button', 'Reject analytics').click();
      screenshot('01-guest-home');
      if (device.name === 'mobile') {
        cy.get('button.mobile-menu-trigger').click();
        screenshot('02-mobile-navigation');
        cy.get('#mobile-navigation').contains('a', 'Run audit').click();
      }
      cy.visit(
        `/audits/user-flow?audit-details=${encodeURIComponent(JSON.stringify(draft(Cypress.env('fixtureBaseUrl'))))}`,
      );
      cy.get('[data-testid="audit-builder-card"]').should('be.visible');
      screenshot('03-build-manual-audit');
      cy.intercept('POST', '/api/audits/user-flow/schedule').as('submitted');
      cy.intercept('GET', /\/api\/audits\/user-flow\/[0-9a-f-]+\/result$/).as('completed');
      cy.get('button.submit-btn').click();
      cy.wait('@submitted').then(({ response }) => {
        runId = response?.body.auditId;
      });
      cy.get('[data-testid="audit-progress-status"]').should('be.visible');
      screenshot('04-queued-or-running');
      cy.wait('@completed', { requestTimeout: 240000, responseTimeout: 240000 })
        .its('response.body.status')
        .should('equal', 'SUCCESS');
      cy.get('ui-audit-summary').should('be.visible');
      screenshot('05-completed-result');
      cy.visit('/audits/history');
      cy.contains('button', 'Checkout performance').should('be.visible');
      screenshot('06-browser-history');
      cy.contains('button', 'Checkout performance').first().click();
      cy.get('ui-audit-summary').should('be.visible');
      screenshot('07-reopened-result');
      saved();
      cy.contains('Keep your audits in a space').should('be.visible');
      screenshot('08-sign-in-required');
      cy.then(() => cy.visit(`/audits/user-flow/${runId}`));
      signIn();
      cy.contains('button', 'Claim into active space').should('be.visible');
      screenshot('09-sign-in-claim-prompt');
      saved();
      cy.contains('Your first saved audit starts here').should('be.visible');
      screenshot('09b-personal-empty-state');
      cy.then(() => cy.visit(`/audits/user-flow/${runId}`));
      cy.contains('button', 'Claim into active space').click();
      cy.contains('Claimed into the active space.').should('be.visible');
      screenshot('10-claim-confirmed-private');
      saved();
      cy.contains('h3', 'Checkout performance').should('be.visible');
      screenshot('11-saved-immutable-version');
      overview().then(({ body }) => {
        const v = body.versions.find((v) => v.templateId);
        expect(v).to.not.equal(undefined);
        versionId = v?.id ?? '';
        templateId = v?.templateId ?? '';
      });
      cy.contains('article', 'Checkout performance')
        .find('button')
        .contains(/^\s*Schedule\s*$/)
        .first()
        .click();
      screenshot('12-fixed-interval-editor');
      cy.contains('button', /^\s*Create schedule\s*$/).click();
      cy.contains('.status', 'active').should('be.visible');
      overview().then(({ body }) => {
        scheduleId = body.schedules.find((s) => s.state === 'active')?.id ?? '';
      });
      screenshot('13-active-schedule-next-due');
      cy.get('article.panel').contains('button', 'Edit recurrence or pinned version').first().click();
      cy.get('form')
        .contains('label', /^Repeat/)
        .find('select')
        .select('daily');
      cy.get('input[type="time"]').clear();
      cy.get('input[type="time"]').type('09:00');
      cy.get('form').contains('label', 'IANA timezone').find('input').clear();
      cy.get('form').contains('label', 'IANA timezone').find('input').type('Europe/Vienna');
      screenshot('14-daily-timezone-editor');
      cy.get('form')
        .contains('label', /^Repeat/)
        .find('select')
        .select('weekly');
      cy.get('form').contains('label', 'Weekday').find('select').select('1');
      screenshot('15-weekly-weekday-editor');
      cy.contains('button', /^\s*Save schedule\s*$/).click();
      cy.contains('Monday at 09:00').should('be.visible');
      cy.then(() => cy.task('captureHistory', { scheduleId, runId }));
      saved();
      cy.contains('button', 'Occurrence history').first().click();
      cy.contains('Missed during downtime').should('be.visible');
      screenshot('16-occurrence-success-failure-skips');
      cy.contains('button', /Pause\s*$/)
        .first()
        .click();
      cy.contains('.status', 'paused').should('be.visible');
      screenshot('17-paused-schedule');
      cy.contains('button', /Resume\s*$/)
        .first()
        .click();
      cy.contains('.status', 'active').should('be.visible');
      screenshot('18-resumed-schedule');
      cy.contains('button', 'Edit as new version').first().click();
      cy.get('input[name="audit title"]').clear();
      cy.get('input[name="audit title"]').type('Checkout performance v2');
      screenshot('19-edit-audit-as-new-version');
      cy.location('search').should('include', 'templateId=');
      cy.contains('button', 'Save immutable version').click();
      cy.contains('Version saved in the active space.').should('be.visible');
      saved();
      cy.contains('h3', 'Checkout performance v2').should('be.visible');
      screenshot('20-two-saved-versions');
      overview().then(({ body }) => {
        expect(body.versions.filter((v) => v.templateId === templateId)).to.have.length(2);
        version2 = body.versions.find((v) => v.templateId === templateId && v.id !== versionId)?.id ?? '';
      });
      cy.contains('button', 'Edit recurrence or pinned version').first().click();
      cy.then(() => cy.get('form').contains('label', 'Pinned audit version').find('select').select(version2));
      screenshot('21-explicitly-repin-version');
      cy.contains('button', /^\s*Save schedule\s*$/).click();
      cy.contains('Saved.').should('be.visible');
      cy.contains('button', 'New schedule').click();
      cy.then(() => cy.get('form').contains('label', 'Pinned audit version').find('select').select(version2));
      cy.contains('button', /^\s*Create schedule\s*$/).click();
      cy.contains('2 / 2 active schedules').should('be.visible');
      screenshot('22-active-schedule-limit');
      cy.contains('button', 'New schedule').click();
      cy.contains('Active schedule limit reached').should('be.visible');
      screenshot('22b-quota-reached-editor');
      cy.then(() => cy.visit(`/audits/user-flow/${runId}`));
      cy.contains('button', 'Create public result link').click();
      cy.get('input[aria-label="Copy public result URL"]')
        .should('be.visible')
        .invoke('val')
        .then((value) => {
          shareUrl = String(value);
        });
      screenshot('23-create-run-share-link');
      cy.get('platform-account').contains('button', 'Sign out').click();
      cy.then(() => cy.visit(shareUrl));
      cy.get('ui-audit-summary').should('be.visible');
      screenshot('24-anonymous-shared-report');
      cy.get('platform-account')
        .contains('button', /^\s*Sign in\s*$/)
        .click();
      saved();
      cy.contains('button', 'Revoke link').first().click();
      cy.contains('Revoked').should('be.visible');
      screenshot('25-share-link-revoked');
      cy.get('platform-account').contains('button', 'Sign out').click();
      cy.then(() => cy.visit(shareUrl));
      cy.contains('This report is unavailable.').should('be.visible');
      screenshot('26-revoked-public-access');
      signIn();
      cy.get('platform-account select').select('demo_team');
      saved();
      cy.contains('Organization space').should('be.visible');
      cy.get('platform-account select').should('have.value', 'demo_team');
      screenshot('26b-organization-empty-state');
      // Create organization resources via the real management API in this isolated demo database.
      cy.request({
        method: 'POST',
        url: endpoint,
        headers: { 'x-audit-space': 'org:demo_team' },
        body: { action: 'save', definition: draft(Cypress.env('fixtureBaseUrl')) },
      }).then(({ body }) => {
        return cy.request({
          method: 'POST',
          url: endpoint,
          headers: { 'x-audit-space': 'org:demo_team' },
          body: { action: 'createSchedule', versionId: body.versionId, recurrence: { kind: 'interval', minutes: 60 } },
        });
      });
      saved();
      cy.contains('h3', 'Checkout performance').should('be.visible');
      screenshot('27-organization-admin');
      cy.get('platform-account summary').click();
      cy.contains('button', 'Members & invitations').should('be.visible');
      screenshot('27a-organization-workspace-menu');
      cy.get('platform-account summary').click();
      cy.contains('article', 'Checkout performance')
        .contains('button', /Run\s*$/)
        .click();
      cy.wait('@completed', { requestTimeout: 240000, responseTimeout: 240000 })
        .its('response.body.status')
        .should('equal', 'SUCCESS');
      cy.get('ui-audit-summary').should('be.visible');
      screenshot('27b-run-saved-organization-version');
      cy.location('pathname').then((path) => {
        const organizationRunId = path.split('/').at(-1);
        cy.request<View>({
          method: 'POST',
          url: endpoint,
          headers: { 'x-audit-space': 'org:demo_team' },
          body: { action: 'list' },
        }).then(({ body }) =>
          cy.task('captureHistory', { scheduleId: body.schedules[0].id, runId: organizationRunId }),
        );
      });
      saved();
      cy.contains('button', 'Edit recurrence or pinned version').first().click();
      cy.get('form').contains('label', 'Schedule manager').find('select').select('user_demo_member');
      screenshot('28-admin-reassigns-schedule');
      cy.contains('button', /^\s*Save schedule\s*$/).click();
      cy.contains('dd', 'Sam Rivera').should('be.visible');
      // A second real UI session uses the organization member identity.
      cy.visit('/audits/saved', {
        onBeforeLoad(win) {
          win.localStorage.setItem('capture-user', 'user_demo_member');
          win.localStorage.setItem('capture-space', 'org:demo_team');
        },
      });
      cy.contains('Organization space').should('be.visible');
      cy.get('platform-account select').should('have.value', 'demo_team');
      cy.contains('h3', 'Checkout performance').should('be.visible');
      cy.contains('button', 'Edit as new version').should('not.exist');
      screenshot('29-organization-member-permissions');
      cy.contains('button', /Pause\s*$/)
        .first()
        .click();
      cy.contains('.status', 'paused').should('be.visible');
      screenshot('30-member-manages-assigned-schedule');
      cy.contains('button', 'Delete schedule').first().click();
      cy.contains('.status', 'deleted').should('be.visible');
      cy.contains('button', 'Occurrence history').first().click();
      cy.contains('Missed during downtime').should('be.visible');
      screenshot('31-deleted-schedule-history-preserved');
    });
  });
}
