import { ExecutorContext } from '@nx/devkit';

import { LambdaDeployExecutorSchema } from './schema';
import executor from './executor';

const options: LambdaDeployExecutorSchema = {} as LambdaDeployExecutorSchema;
const context: ExecutorContext = {
  root: '',
  cwd: process.cwd(),
  isVerbose: false,
};

describe.skip('LambdaDeply Executor', () => {
  it('can run', async () => {
    const output = await executor(options, context);
    expect(output.success).toBe(true);
  });
});
