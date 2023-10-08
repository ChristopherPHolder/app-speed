import { S3UploadExecutorSchema } from './schema';

export default async function runExecutor(options: S3UploadExecutorSchema) {
  console.log('Executor ran for S3Upload', options);
  return {
    success: true,
  };
}
