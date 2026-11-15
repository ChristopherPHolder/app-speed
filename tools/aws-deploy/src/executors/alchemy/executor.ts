import { spawn } from 'node:child_process';
import { join } from 'node:path';
import type { ExecutorContext } from '@nx/devkit';

import type { AlchemyExecutorSchema } from './schema.d.ts';

export const alchemyArguments = (options: AlchemyExecutorSchema): string[] => {
  const command = options.command ?? 'deploy';
  return [
    command,
    '--config',
    options.stack,
    '--stage',
    options.stage,
    // CI has no one to answer a prompt; a deploy target is the approval.
    ...(command === 'deploy' ? ['--yes'] : []),
    ...(command === 'deploy' && options.force ? ['--force'] : []),
  ];
};

export default async function alchemy(
  options: AlchemyExecutorSchema,
  context: Pick<ExecutorContext, 'root'>,
): Promise<{ success: boolean }> {
  return await new Promise((resolve) => {
    const child = spawn(join(context.root, 'node_modules', '.bin', 'alchemy'), alchemyArguments(options), {
      cwd: context.root,
      stdio: 'inherit',
      env: { ...process.env, ALCHEMY_TELEMETRY_DISABLED: '1' },
    });
    child.on('error', () => resolve({ success: false }));
    child.on('close', (code) => resolve({ success: code === 0 }));
  });
}
