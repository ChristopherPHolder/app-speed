import { defineConfig } from 'cypress';
import { clerkSetup } from '@clerk/testing/cypress';
import { createClerkClient } from '@clerk/backend';

export default defineConfig({
  video: true,
  screenshotsFolder: '../../dist/cypress/apps/portal-e2e/clerk-screenshots',
  videosFolder: '../../dist/cypress/apps/portal-e2e/clerk-videos',
  e2e: {
    baseUrl: process.env['PORTAL_BASE_URL'] ?? 'http://127.0.0.1:4200',
    specPattern: 'clerk/**/*.cy.ts',
    supportFile: 'support/e2e.ts',
    defaultCommandTimeout: 20000,
    async setupNodeEvents(on, config) {
      await clerkSetup({ config });
      const clerk = createClerkClient({ secretKey: process.env['CLERK_SECRET_KEY'] });
      const emails = new Set<string>();
      const newAccount = () => {
        const suffix = `${Date.now()}-${emails.size}`;
        const account = { email: `appspeed-e2e-${suffix}+clerk_test@example.com`, username: `appspeed_e2e_${suffix}` };
        emails.add(account.email);
        return account;
      };
      on('task', {
        async createClerkTestUser() {
          const { email, username } = newAccount();
          const user = await clerk.users
            .createUser({
              emailAddress: [email],
              username,
              skipPasswordRequirement: true,
              skipLegalChecks: true,
            })
            .catch((error: unknown) => {
              if (typeof error === 'object' && error !== null && 'errors' in error)
                throw new Error(JSON.stringify(error.errors));
              throw error;
            });
          if (!user.id) throw new Error('Test user was not created.');
          return email;
        },
      });
      on('after:run', async () => {
        for (const email of emails) {
          const users = await clerk.users.getUserList({ emailAddress: [email] });
          for (const user of users.data) await clerk.users.deleteUser(user.id);
        }
      });
      return config;
    },
  },
});
