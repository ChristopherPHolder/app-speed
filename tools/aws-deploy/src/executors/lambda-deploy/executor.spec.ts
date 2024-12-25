import { ExecutorContext, NxJsonConfiguration, ProjectGraph, ProjectsConfigurations } from '@nx/devkit';

import { LambdaDeployExecutorSchema } from './schema';
import executor from './executor';
import { cwd } from 'node:process';

const options: LambdaDeployExecutorSchema = {} as LambdaDeployExecutorSchema;
const context: ExecutorContext = {
  nxJsonConfiguration: undefined as unknown as NxJsonConfiguration<'*' | string[]>,
  projectGraph: undefined as unknown as ProjectGraph,
  projectsConfigurations: undefined as unknown as ProjectsConfigurations,
  root: '',
  cwd: cwd(),
  isVerbose: false,
};

describe.skip('LambdaDeply Executor', () => {
  it('can run', async () => {
    const output = await executor(options, context);
    expect(output.success).toBe(true);
  });
});
