import dotenv from 'dotenv'
dotenv.config()
import { readFileSync, unlinkSync } from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export async function uploadResultsToBucket(urlString: string): Promise<void> {
  const filePath = './measures/deep-blue-performance-test.uf.html';
  const recordBody = readFileSync(filePath);
  const recordKey = getRecordKey(urlString);
  await uploadRecord(recordKey, recordBody);
  unlinkSync(filePath);
}

function getRecordKey(urlString: string): string {
  const url = new URL(urlString);
  const timestamp = new Date().toISOString().slice(0,16).replace(":", "_");
  return `${timestamp}${url.hostname}.uf.html`
}

async function uploadRecord(recordKey: string, recordBody: Buffer): Promise<void> {
  const client = new S3Client({region: 'eu-central-1'});
  const params = {
    Bucket: 'deepblue-userflow-records',
    Key: recordKey,
    Body: recordBody,
    CacheControl: 'public, max-age=0, must-revalidate',
    ContentType: 'text/html'
  };
  const command = new PutObjectCommand(params);
  await client.send(command);
}