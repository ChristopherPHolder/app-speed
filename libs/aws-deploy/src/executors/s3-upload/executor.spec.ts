import { S3UploadExecutorSchema } from './schema';
import executor from './executor';
import { EXECUTOR_FAIL_BASE, EXECUTOR_SUCCESS_BASE, INVALID_BUCKET, MISSING_BUCKET } from './constants';
import { ExecutorContext } from 'nx/src/config/misc-interfaces';
import { getCwd } from '@nx/plugin/testing';
import { getRootDirs } from '@angular/compiler-cli/src/ngtsc/util/src/typescript';

const options: S3UploadExecutorSchema = {
  bucket: 'Example-bucket',
  dryRun: true
};

const context: ExecutorContext = {
  root: '',
  cwd: getCwd(),
  isVerbose: false,
}

describe('S3Upload Executor', () => {
  it('can run', async () => {
    const output = await executor(options);
    expect(output.success).toBe(true);
    expect(output.message).toContain(EXECUTOR_SUCCESS_BASE);
  });

  it('fails if no bucket', async () => {
    const opt = options;
    opt.bucket = undefined as unknown as string;
    const output = await executor(opt);
    expect(output.success).toBe(false);
    expect(output.message).toContain(EXECUTOR_FAIL_BASE);
    expect(output.message).toContain(MISSING_BUCKET);
  });

  it('fails on invalid bucket', async () => {
    const opt = options;
    opt.bucket = 'Invalid Bucket';
    const output = await executor(opt);
    expect(output.success).toBe(false);
    expect(output.message).toContain(EXECUTOR_FAIL_BASE);
    expect(output.message).toContain(INVALID_BUCKET);
  });
});
