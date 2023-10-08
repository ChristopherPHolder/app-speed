import { S3UploadExecutorSchema } from './schema';
import { EXECUTOR_FAIL_BASE, EXECUTOR_SUCCESS_BASE, INVALID_BUCKET, MISSING_BUCKET } from './constants';
import { ExecutorContext } from 'nx/src/config/misc-interfaces';

export default async function runExecutor(
  options: S3UploadExecutorSchema,
  context?: ExecutorContext
): Promise<{ success: boolean, message: string }> {

  console.info('Executing S3 Upload', options, context);

  if (!options.bucket) {
    return {
      success: false,
      message: `${EXECUTOR_FAIL_BASE} ${MISSING_BUCKET}`
    }
  }

  if (!isValidBucketName(options.bucket)) {
    return {
      success: false,
      message: `${EXECUTOR_FAIL_BASE} ${INVALID_BUCKET}`
    }
  }

  return {
    success: true,
    message: EXECUTOR_SUCCESS_BASE
  };
}

function isValidBucketName(bucketName: string): boolean {
  if (bucketName.includes(' ')) {
    return false;
  }
  return true;
}
