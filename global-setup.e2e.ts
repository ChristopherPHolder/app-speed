import { execSync } from 'child_process';
import startLocalRegistry from './tools/scripts/start-local-registry';
import stopLocalRegistry from './tools/scripts/stop-local-registry';

export async function setup() {
  await startLocalRegistry();
  execSync('npm install -D @app-speed/esbuild-meta@e2e');
}

export async function teardown() {
  stopLocalRegistry();
  execSync('npm uninstall @app-speed/esbuild-meta');
}
