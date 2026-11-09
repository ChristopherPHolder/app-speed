import { spawn } from 'node:child_process';
import type { ExecutorContext } from '@nx/devkit';

interface WorkflowDispatchOptions {
  workflow: string;
  ref: string;
  environment: 'development' | 'production';
}

export default async function workflowDispatch(
  options: WorkflowDispatchOptions,
  context: Pick<ExecutorContext, 'root'>,
) {
  if (
    !['deploy-api.yml', 'deploy-runner.yml'].includes(options.workflow) ||
    !options.ref ||
    !['development', 'production'].includes(options.environment)
  )
    throw new Error('Select a deployment workflow, Git ref, and environment.');
  const args = ['workflow', 'run', options.workflow, '--ref', options.ref, '-f', `environment=${options.environment}`];
  return await new Promise<{ success: boolean }>((resolve) => {
    const child = spawn('gh', args, { cwd: context.root, stdio: 'inherit' });
    child.on('error', () => resolve({ success: false }));
    child.on('close', (code) => resolve({ success: code === 0 }));
  });
}
