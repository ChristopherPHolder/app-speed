import { BundleExecutorSchema } from './schema';
import executor from './executor';

const options: BundleExecutorSchema = {
  main: 'packages/project-name/src/main.ts',
  outputPath: 'dist/packages/project-name',
};

describe.skip('Bundle Executor', () => {
  it('can run', async () => {
    const output = await executor(options);
    expect(output.success).toBe(true);
  });
});
