import { PromiseExecutor } from '@nx/devkit';
import { S3UploadExecutorSchema } from './schema';

const runExecutor: PromiseExecutor<S3UploadExecutorSchema> = async (options) => {
  console.log('Executor ran for S3Upload', options);
  return {
    success: true,
  };
};

export default runExecutor;
