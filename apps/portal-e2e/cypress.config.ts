import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
import { defineConfig } from 'cypress';

const nxPreset = nxE2EPreset(__filename, {
  cypressDir: '.',
});

export default defineConfig({
  video: true,
  retries: 0,
  e2e: {
    ...nxPreset,
    baseUrl: process.env['PORTAL_BASE_URL'] ?? 'http://127.0.0.1:4200',
    defaultCommandTimeout: 20_000,
    requestTimeout: 20_000,
    responseTimeout: 300_000,
    env: {
      fixtureBaseUrl: process.env['FIXTURE_BASE_URL'] ?? 'https://localhost:4443',
    },
    async setupNodeEvents(on, config) {
      if (nxPreset.setupNodeEvents) {
        await nxPreset.setupNodeEvents(on, config);
      }

      on('before:browser:launch', (browser, launchOptions) => {
        const certificateSpki = process.env['TEST_HTTPS_CERT_SPKI'];
        if (certificateSpki && browser.family === 'chromium') {
          launchOptions.args.push(`--ignore-certificate-errors-spki-list=${certificateSpki}`);
        }
        if (process.env['APP_SPEED_DEMO_CAPTURE'] === 'true' && browser.family === 'chromium') {
          // Leave room for the Cypress sidebar and the complete 1440px application viewport.
          launchOptions.args = launchOptions.args.filter((arg) => !arg.startsWith('--window-size='));
          launchOptions.args.push('--window-size=2000,1600');
        }
        return launchOptions;
      });

      return config;
    },
  },
});
