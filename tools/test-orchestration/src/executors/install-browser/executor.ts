import { type ExecutorContext, logger } from '@nx/devkit';
import { spawn } from 'node:child_process';

/** Install the Chrome build pinned by the workspace's Puppeteer version. */
export default function installBrowserExecutor(
  _options: Record<string, never>,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  return new Promise((resolve) => {
    const child = spawn('pnpm', ['exec', 'puppeteer', 'browsers', 'install', 'chrome'], {
      cwd: context.root,
      stdio: 'inherit',
    });
    child.once('error', (error) => {
      logger.error(`Failed to install Chrome: ${error.message}`);
      resolve({ success: false });
    });
    child.once('exit', (code) => resolve({ success: code === 0 }));
  });
}
