import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
import { defineConfig } from 'cypress';
import { type ChildProcess, spawn } from 'node:child_process';
import * as path from 'node:path';

const workspaceRoot = path.resolve(__dirname, '../..');
const backendUrl = 'http://localhost:3000/api/health';
let backendProcess: ChildProcess | null = null;

const waitForBackend = async (timeoutMs = 60000) => {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const response = await fetch(backendUrl);
      if (response.ok) return;
    } catch {
      // ignore and retry
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Backend not ready after ${timeoutMs}ms: ${backendUrl}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
};

const ensureBackend = async () => {
  if (!backendProcess) {
    backendProcess = spawn('pnpm exec nx run server:serve:development', {
      cwd: workspaceRoot,
      shell: true,
      stdio: 'inherit',
      env: {
        ...process.env,
        RUNNER_MODE: 'local',
        RUNNER_HEADLESS: 'true',
      },
    });
  }

  await waitForBackend();
};

const nxPreset = nxE2EPreset(__filename, {
  cypressDir: '.',
});

export default defineConfig({
  e2e: {
    ...nxPreset,
    async setupNodeEvents(on, config) {
      if (nxPreset.setupNodeEvents) {
        await nxPreset.setupNodeEvents(on, config);
      }

      await ensureBackend();

      on('after:run', () => {
        if (backendProcess) {
          backendProcess.kill('SIGTERM');
          backendProcess = null;
        }
      });

      return config;
    },
  },
});
