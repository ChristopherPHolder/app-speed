import { spawn } from 'node:child_process';
import type { ExecutorContext } from '@nx/devkit';

interface WorkflowRerunOptions {
  runId: number;
  failedOnly?: boolean;
}

// Keep operational workflow retries behind an Nx executor, just like initial deployments.
export default async function workflowRerun(options: WorkflowRerunOptions, context: Pick<ExecutorContext, 'root'>) {
  if (!Number.isSafeInteger(options.runId) || options.runId <= 0)
    throw new Error('runId must be a GitHub Actions run ID.');
  const args = ['run', 'rerun', String(options.runId), ...(options.failedOnly ? ['--failed'] : [])];
  return await new Promise<{ success: boolean }>((resolve) => {
    const child = spawn('gh', args, { cwd: context.root, stdio: 'inherit' });
    child.on('error', () => resolve({ success: false }));
    child.on('close', (code) => resolve({ success: code === 0 }));
  });
}
