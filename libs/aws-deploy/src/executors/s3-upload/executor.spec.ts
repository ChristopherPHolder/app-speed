import { S3UploadExecutorSchema } from './schema';
import executor from './executor';

const options: S3UploadExecutorSchema = {};

describe('S3Upload Executor', () => {
  it('can run', async () => {
    const output = await executor(options);
    expect(output.success).toBe(true);
  });
});
