import { S3UploadExecutorSchema } from './schema';
import executor from './executor';
import { EXECUTOR_FAIL_BASE, EXECUTOR_SUCCESS_BASE, INVALID_BUCKET, MISSING_BUCKET, MISSING_UPLOAD } from './constants';

const options: S3UploadExecutorSchema = {
  bucket: 'example-bucket',
  upload: 'example-upload',
};

describe('S3Upload Executor', () => {
  it('can run', async () => {
    const output = await executor(options);
    expect(output.success).toBe(true);
    expect(output.message).toContain(EXECUTOR_SUCCESS_BASE);
  });

  it('fails if no bucket option', async () => {
    const output = await executor({
      ...options,
      bucket: undefined as unknown as string,
    });
    expect(output.success).toBe(false);
    expect(output.message).toContain(EXECUTOR_FAIL_BASE);
    expect(output.message).toContain(MISSING_BUCKET);
  });

  it('fails on invalid bucket option', async () => {
    const output = await executor({
      ...options,
      bucket: 'invalid bucket name',
    });
    expect(output.success).toBe(false);
    expect(output.message).toContain(EXECUTOR_FAIL_BASE);
    expect(output.message).toContain(INVALID_BUCKET);
  });

  it('fails if no upload option', async () => {
    const output = await executor({
      ...options,
      upload: undefined as unknown as string,
    });
    expect(output.success).toBe(false);
    expect(output.message).toContain(EXECUTOR_FAIL_BASE);
    expect(output.message).toContain(MISSING_UPLOAD);
  });
});
