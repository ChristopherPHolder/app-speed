import { S3UploadExecutorSchema } from './schema';
import { EXECUTOR_FAIL_BASE, EXECUTOR_SUCCESS_BASE, INVALID_BUCKET, MISSING_BUCKET, MISSING_UPLOAD } from './constants';
import { ExecutorContext } from '@nx/devkit';
import { execSync } from 'child_process';

type ExecutorExit = {
  success: boolean;
  message: string;
}

export default async function runExecutor(
  options: S3UploadExecutorSchema,
  context?: ExecutorContext
): Promise<ExecutorExit> {
  console.info('Executing S3 Upload');

  if (!options.bucket) {
    console.log(`${EXECUTOR_FAIL_BASE} ${MISSING_BUCKET}`)
    return {
      success: false,
      message: `${EXECUTOR_FAIL_BASE} ${MISSING_BUCKET}`
    }
  }

  if (!isValidBucketName(options.bucket)) {
    console.log(`${EXECUTOR_FAIL_BASE} ${INVALID_BUCKET}`);
    return {
      success: false,
      message: `${EXECUTOR_FAIL_BASE} ${INVALID_BUCKET}`
    };
  }

  if (!options.upload) {
    console.log(`${EXECUTOR_FAIL_BASE} ${MISSING_UPLOAD}`);
    return {
      success: false,
      message: `${EXECUTOR_FAIL_BASE} ${MISSING_UPLOAD}`
    };
  }

  if (context) {
    try {
      execSync(`aws s3 sync ./${options.upload} ${options.bucket} --delete`)
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          message: error.message
        }
      }
      return {
        success: false,
        message: 'Unexpected Error when tying to upload to s3'
      }
    }
  }

  console.log(EXECUTOR_SUCCESS_BASE);
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
