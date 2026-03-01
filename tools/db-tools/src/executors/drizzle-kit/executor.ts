import { spawn } from 'node:child_process';
import * as path from 'node:path';
import { ExecutorContext, logger, type PromiseExecutor } from '@nx/devkit';

import { type DrizzleKitExecutorSchema } from './schema';

const runProcess = (command: string, args: string[], cwd: string): Promise<number> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', reject);
    child.on('close', (code) => resolve(code ?? 1));
  });

const runExecutor: PromiseExecutor<DrizzleKitExecutorSchema> = async (options, context: ExecutorContext) => {
  const workspaceRoot = context.root ?? process.cwd();
  const cwd = path.resolve(workspaceRoot, options.cwd ?? '.');
  const args = ['exec', 'drizzle-kit', options.command];

  if (options.config) {
    args.push('--config', path.resolve(workspaceRoot, options.config));
  }

  if (options.args) {
    args.push(...options.args);
  }

  const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

  try {
    const exitCode = await runProcess(pnpmCommand, args, cwd);

    if (exitCode !== 0) {
      logger.error(`drizzle-kit ${options.command} failed with exit code ${exitCode}`);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    logger.error(`Failed to execute drizzle-kit ${options.command}: ${String(error)}`);
    return { success: false };
  }
};

export default runExecutor;
