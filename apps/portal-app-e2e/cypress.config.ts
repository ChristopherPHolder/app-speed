import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
import { defineConfig } from 'cypress';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import * as path from 'node:path';

const workspaceRoot = path.resolve(__dirname, '../..');
const backendUrl = 'http://localhost:3000/api/health';
const e2eDbFile = path.resolve(workspaceRoot, 'tmp', 'e2e.db');
const e2eDbRelative = path.relative(workspaceRoot, e2eDbFile);
let backendProcess: ChildProcess | null = null;
let dbPrepared = false;

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
  if (!dbPrepared) {
    dbPrepared = true;
    fs.mkdirSync(path.dirname(e2eDbFile), { recursive: true });
    if (fs.existsSync(e2eDbFile)) {
      fs.unlinkSync(e2eDbFile);
    }
    fs.writeFileSync(e2eDbFile, '');
    execFileSync('npx', ['prisma', 'migrate', 'deploy', '--config', 'libs/server/db/prisma.config.ts'], {
      cwd: workspaceRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: e2eDbRelative,
      },
    });
  }

  try {
    const response = await fetch(backendUrl);
    if (response.ok) return;
  } catch {
    // start backend below
  }

  if (!backendProcess) {
    backendProcess = spawn('npx nx run server:serve:development', {
      cwd: workspaceRoot,
      shell: true,
      stdio: 'inherit',
      env: {
        ...process.env,
        RUNNER_MODE: 'local',
        RUNNER_HEADLESS: 'true',
        DATABASE_URL: e2eDbRelative,
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
