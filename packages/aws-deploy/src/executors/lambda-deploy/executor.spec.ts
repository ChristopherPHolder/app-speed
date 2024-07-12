import { ExecutorContext } from '@nx/devkit';

import { LambdaDeplyExecutorSchema } from './schema';
import executor from './executor';

const options: LambdaDeplyExecutorSchema = {};
const context: ExecutorContext = {
  root: '',
  cwd: process.cwd(),
  isVerbose: false,
};

describe('LambdaDeply Executor', () => {
  it('can run', async () => {
    const output = await executor(options, context);
    expect(output.success).toBe(true);
  });
});
