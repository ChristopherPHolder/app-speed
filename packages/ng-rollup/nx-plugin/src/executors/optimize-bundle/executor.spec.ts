import { OptimizeBundleExecutorSchema } from './schema';
import executor from './executor';

const options: OptimizeBundleExecutorSchema = {};

describe('OptimizeBundle Executor', () => {
  it('can run', async () => {
    const output = await executor(options);
    expect(output.success).toBe(true);
  });
});
