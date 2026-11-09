import { action, confirm, openNavigation, overview, snapshot, submitName, visitAs } from '../support/workspaces';

for (const viewport of ['desktop', 'mobile']) {
  describe(`${viewport}: workspace and project journeys`, () => {
    beforeEach(() => {
      cy.viewport(viewport === 'desktop' ? 1440 : 390, viewport === 'desktop' ? 1000 : 844);
      cy.clearAllLocalStorage();
      for (const account of ['admin', 'member', 'outsider'] satisfies ReadonlyArray<'admin' | 'member' | 'outsider'>) {
        overview(account).then((result) => {
          for (const workspace of result.workspaces.filter((item) => item.role === 'admin')) {
            action({ action: 'deleteWorkspace', workspaceId: workspace.id }, account);
          }
        });
      }
    });

    it('creates the default project, persists it on reload, and adds and renames another project', () => {
      visitAs('/public', '');
      cy.contains('h1', 'Public View').should('be.visible');
      snapshot(viewport, '01-anonymous-public-view');
      cy.request({ url: '/api/workspaces', failOnStatusCode: false }).its('status').should('eq', 401);
      visitAs('/workspaces/join', '');
      cy.location('pathname').should('eq', '/sign-in');
      snapshot(viewport, '02-sign-in');
      visitAs('/workspaces/join');
      snapshot(viewport, '03-create-or-join');
      cy.contains('button', 'Create workspace').click();
      cy.get('input[autocomplete="off"]').type('Holder');
      snapshot(viewport, '04-workspace-name');
      cy.contains('button', 'Create workspace').click();
      cy.contains('h1', /^Holder$/).should('be.visible');
      cy.location('pathname').should('match', /\/projects\//);
      snapshot(viewport, '05-default-project');
      cy.reload();
      cy.contains('h1', /^Holder$/).should('be.visible');
      overview().then(({ workspaces }) => {
        const workspace = workspaces[0];
        expect(workspace.projects.map((project) => project.name)).to.deep.equal(['Holder']);
        visitAs(`/workspaces/${workspace.id}`);
      });
      snapshot(viewport, '06-project-list');
      cy.contains('button', 'New project').click();
      cy.get('mat-dialog-container input').type('Storefront');
      snapshot(viewport, '07-create-project-dialog');
      cy.get('mat-dialog-container form').submit();
      cy.contains('h1', /^Storefront$/).should('be.visible');
      cy.contains('a', 'Project settings').click();
      snapshot(viewport, '08-project-settings');
      cy.contains('button', 'Rename project').click();
      submitName('Shop');
      cy.contains('.page-heading p', 'Shop').should('be.visible');
      snapshot(viewport, '09-renamed-project');
      cy.contains('button', 'Delete project').click();
      snapshot(viewport, '10-delete-project-confirmation');
      confirm('Delete project');
      cy.contains('h1', 'Projects').should('be.visible');
      cy.get('[aria-label="Workspace projects"]').should('not.contain.text', 'Shop');
    });

    it('recovers a saved workspace after a failed reload without creating it twice', () => {
      visitAs('/workspaces/join');
      cy.contains('button', 'Create workspace').click();
      cy.get('input[autocomplete="off"]').type('Holder');
      cy.intercept('POST', '/api/workspaces/actions').as('createWorkspace');
      cy.intercept({ method: 'GET', pathname: '/api/workspaces', times: 1 }, { statusCode: 503, body: {} });
      cy.contains('button', 'Create workspace').click();
      cy.wait('@createWorkspace').its('response.statusCode').should('eq', 200);
      cy.contains('[role="alert"]', 'Your changes were saved').should('be.visible');
      cy.location('pathname').should('eq', '/workspaces/join');
      cy.get('app-workspace-onboarding form').should('not.exist');
      snapshot(viewport, '30-saved-workspace-recovery');
      cy.contains('button', 'Try again').click();
      cy.contains('h1', /^Holder$/).should('be.visible');
      cy.location('pathname').should('match', /\/projects\/[^/]+$/);
      cy.get('@createWorkspace.all').should('have.length', 1);
      overview().then(({ workspaces }) => {
        expect(workspaces.map((workspace) => workspace.name)).to.deep.equal(['Holder']);
        expect(workspaces[0].projects.map((project) => project.name)).to.deep.equal(['Holder']);
      });
    });

    it('switches workspaces, restores each last project, and keeps Public View outside the workspace', () => {
      action({ action: 'createWorkspace', name: 'Holder' }).then(({ id }) => {
        action({ action: 'createProject', workspaceId: id, name: 'Storefront' }).then((project) => {
          visitAs(`/workspaces/${id}/projects/${project.id}`);
          cy.contains('h1', 'Storefront').should('be.visible');
        });
      });
      action({ action: 'createWorkspace', name: 'Team' }).then(({ id }) => {
        visitAs(`/workspaces/${id}`);
        cy.contains('h1', 'Projects').should('be.visible');
      });
      openNavigation();
      cy.get('[aria-label^="Switch workspace:"]').click();
      snapshot(viewport, '11-workspace-switcher');
      cy.contains('[role="menuitem"]', 'Holder').click();
      cy.contains('h1', 'Storefront').should('be.visible');
      openNavigation();
      if (viewport === 'mobile') snapshot(viewport, '12-mobile-navigation');
      cy.get('[aria-label^="Switch workspace:"]').click();
      cy.contains('[role="menuitem"]', 'Public View').click();
      cy.contains('h1', 'Public View').should('be.visible');
      cy.get('main').should('not.contain.text', 'Storefront');
      snapshot(viewport, '13-signed-in-public-view');
      openNavigation();
      cy.get('[aria-label^="Switch workspace:"]').click();
      cy.contains('[role="menuitem"]', 'Holder').click();
      cy.contains('h1', 'Storefront').should('be.visible');
      cy.get('[aria-label="Open account menu"]').filter(':visible').click();
      snapshot(viewport, '14-account-menu');
      cy.contains('button', 'Sign out').click();
      visitAs('/workspaces', '');
      cy.location('pathname').should('eq', '/sign-in');
    });

    it('invites a second user, grants and revokes access, and rejects direct URL and API attacks', () => {
      action({ action: 'createWorkspace', name: 'Holder' });
      overview().then(({ workspaces }) => {
        const workspace = workspaces[0];
        const project = workspace.projects[0];
        visitAs(`/workspaces/${workspace.id}/settings/members`);
        cy.contains('button', 'Invite member').click();
        cy.contains('mat-label', 'Email address').click();
        cy.get('input[autocomplete="email"]').should('be.visible').type('pat@example.com');
        snapshot(viewport, '15-invite-member');
        cy.contains('button', 'Create invitation').click();
        cy.get('[aria-label="Pending invitations"]').should('contain.text', 'pat@example.com');
        snapshot(viewport, '16-pending-invitation');
        overview('member').then((result) => {
          action({ action: 'acceptInvitation', invitationId: result.invitations[0].id }, 'outsider', 409);
        });
        visitAs('/workspaces/join', 'member');
        cy.contains('h2', 'Invitations').should('be.visible');
        snapshot(viewport, '17-accept-invitation');
        cy.contains('button', /^\s*Accept\s*$/).click();
        cy.contains('h2', 'No projects yet').should('be.visible');
        snapshot(viewport, '18-member-without-access');
        action(
          { action: 'renameProject', workspaceId: workspace.id, projectId: project.id, name: 'Attack' },
          'member',
          403,
        );
        visitAs(`/workspaces/${workspace.id}/projects/${project.id}`, 'member');
        cy.location('pathname').should('eq', `/workspaces/${workspace.id}`);
        visitAs(`/workspaces/${workspace.id}/projects/${project.id}/settings`);
        cy.get('[aria-label="Grant project access to Pat"]').click();
        cy.get('[aria-label="Remove project access for Pat"]').should('exist');
        snapshot(viewport, '19-project-access-granted');
        visitAs(`/workspaces/${workspace.id}/projects/${project.id}`, 'member');
        cy.contains('h1', /^Holder$/).should('be.visible');
        cy.get('main').should('not.contain.text', 'Project settings');
        snapshot(viewport, '20-member-project');
        visitAs(`/workspaces/${workspace.id}/projects/${project.id}/settings`, 'member');
        cy.location('pathname').should('eq', `/workspaces/${workspace.id}/projects/${project.id}`);
        visitAs(`/workspaces/${workspace.id}/projects/${project.id}/settings`);
        cy.get('[aria-label="Remove project access for Pat"]').click();
        cy.get('[aria-label="Grant project access to Pat"]').should('exist');
        visitAs(`/workspaces/${workspace.id}/projects/${project.id}`, 'member');
        cy.contains('h2', 'No projects yet').should('be.visible');
        snapshot(viewport, '21-access-revoked');
        visitAs(`/workspaces/${workspace.id}`, 'outsider');
        cy.location('pathname').should('eq', '/public');
        action({ action: 'createProject', workspaceId: workspace.id, name: 'Attack' }, 'outsider', 403);
        action({ action: 'removeMember', workspaceId: workspace.id, accountId: 'user_member' });
        overview('member').its('workspaces').should('have.length', 0);
      });
    });

    it('renames the workspace, updates its logo, and protects the final admin', () => {
      action({ action: 'createWorkspace', name: 'Holder' }).then(({ id }) => {
        visitAs(`/workspaces/${id}/settings`);
        snapshot(viewport, '22-workspace-settings');
        cy.contains('button', 'Rename workspace').click();
        submitName('Holder team');
        cy.contains('.page-heading p', 'Holder team').should('be.visible');
        cy.document().then((doc) => {
          const canvas = doc.createElement('canvas');
          canvas.width = canvas.height = 128;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Missing canvas');
          context.fillStyle = '#005cbb';
          context.fillRect(0, 0, 128, 128);
          cy.get('input[type="file"]').selectFile(
            {
              contents: Cypress.Buffer.from(canvas.toDataURL('image/png').split(',')[1], 'base64'),
              fileName: 'logo.png',
              mimeType: 'image/png',
            },
            { force: true },
          );
        });
        cy.contains('button', 'Remove logo').should('be.visible');
        snapshot(viewport, '23-workspace-logo');
        cy.contains('button', 'Remove logo').click();
        cy.contains('button', 'Upload logo').should('be.visible');
        cy.contains('button', 'Leave workspace').click();
        snapshot(viewport, '24-leave-workspace-confirmation');
        confirm('Leave workspace');
        cy.contains('[role="alert"]', 'Assign another admin').should('be.visible');
        snapshot(viewport, '25-last-admin-protection');
        cy.contains('button', 'Delete workspace').click();
        confirm('Delete workspace');
        cy.contains('h1', 'Public View').should('be.visible');
        overview().its('workspaces').should('have.length', 0);
      });
    });
    it('declines and revokes invitations, transfers admin rights, and lets a member leave', () => {
      action({ action: 'createWorkspace', name: 'Holder' }).then(({ id }) => {
        action({ action: 'inviteMember', workspaceId: id, email: 'pat@example.com', role: 'member' });
        visitAs('/workspaces/join', 'member');
        cy.contains('button', 'Decline').click();
        cy.contains('h2', 'Invitations').should('not.exist');
        snapshot(viewport, '26-invitation-declined');
        action({ action: 'inviteMember', workspaceId: id, email: 'pat@example.com', role: 'member' });
        visitAs(`/workspaces/${id}/settings/members`);
        cy.contains('button', 'Revoke').click();
        cy.get('[aria-label="Pending invitations"]').should('not.exist');
        overview('member').its('invitations').should('have.length', 0);
        action({ action: 'inviteMember', workspaceId: id, email: 'pat@example.com', role: 'member' });
        overview('member').then((result) =>
          action({ action: 'acceptInvitation', invitationId: result.invitations[0].id }, 'member'),
        );
        visitAs(`/workspaces/${id}/settings/members`);
        cy.get('[aria-label="Manage Pat"]').click();
        cy.contains('button', 'Make admin').click();
        snapshot(viewport, '27-promote-admin-confirmation');
        confirm('Change role');
        cy.get('[aria-label="Workspace members"]').should('contain.text', 'Pat');
        snapshot(viewport, '28-workspace-members');
        action({ action: 'setRole', workspaceId: id, accountId: 'user_admin', role: 'member' });
        visitAs(`/workspaces/${id}/settings`);
        cy.contains('button', 'Rename workspace').should('not.exist');
        snapshot(viewport, '29-member-workspace-settings');
        cy.contains('button', 'Leave workspace').click();
        confirm('Leave workspace');
        cy.contains('h1', 'Public View').should('be.visible');
        overview().its('workspaces').should('have.length', 0);
        // The remaining admin cleans up this workspace before the next journey.
        action({ action: 'deleteWorkspace', workspaceId: id }, 'member');
      });
    });
  });
}
