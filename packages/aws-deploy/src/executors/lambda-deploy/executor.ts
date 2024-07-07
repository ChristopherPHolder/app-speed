import { resolve } from 'node:path';
import { PassThrough } from 'node:stream';
import { PromiseExecutor } from '@nx/devkit';
import { LambdaClient, UpdateFunctionCodeCommand } from '@aws-sdk/client-lambda';

import { LambdaDeployExecutorSchema } from './schema';
import archiver = require('archiver');

const zip = (sourceDir: string): Promise<Uint8Array> => {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const passThrough = new PassThrough();
  const chunks: Uint8Array[] = [];

  return new Promise((resolve, reject) => {
    archive
      .directory(sourceDir, false)
      .on('error', (err) => reject(err))
      .pipe(passThrough);

    passThrough.on('data', (chunk) => chunks.push(new Uint8Array(chunk)));
    passThrough.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', (err) => reject(err));
    archive.finalize();
  });
};

const runExecutor: PromiseExecutor<LambdaDeployExecutorSchema> = async ({ dist, functionName }) => {
  const client = new LambdaClient({
    region: 'us-east-1',
  });

  const file = await zip(resolve(dist));

  await client.send(
    new UpdateFunctionCodeCommand({
      FunctionName: functionName,
      ZipFile: file,
      DryRun: false,
    }),
  );

  return {
    success: true,
  };
};

export default runExecutor;
