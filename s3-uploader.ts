import dotenv from 'dotenv'
dotenv.config()
import { readFileSync, unlinkSync } from 'fs';
import { S3Client, PutObjectCommand, PutObjectCommandOutput } from '@aws-sdk/client-s3';

export async function uploadResultsToBucket(urlString: string): Promise<PutObjectCommandOutput> {
  const filePath = './measures/deep-blue-performance-test.uf.html';
  const recordBody = readFileSync(filePath);
  const recordKey = getRecordKey(urlString);
  const uploadResponse = await uploadRecord(recordKey, recordBody);
  unlinkSync(filePath);
  return uploadResponse;
}

function getRecordKey(urlString: string): string {
  const url = new URL(urlString);
  const timestamp = new Date().toISOString().slice(0,16).replace(":", "_");
  return `${timestamp}${url.hostname}.uf.html`
}

async function uploadRecord(recordKey: string, recordBody: Buffer): Promise<PutObjectCommandOutput> {
  const client = new S3Client({region: 'eu-central-1'});
  const params = {
    Bucket: 'deepblue-userflow-records',
    Key: recordKey,
    Body: recordBody,
    CacheControl: 'public, max-age=0, must-revalidate',
    ContentType: 'text/html'
  };
  const command = new PutObjectCommand(params);
  return await client.send(command);
}