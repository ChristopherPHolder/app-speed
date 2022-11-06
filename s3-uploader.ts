import dotenv from 'dotenv'
dotenv.config()
import { readFileSync, unlinkSync } from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const hostUrl = 'https://deepblue-userflow-records.s3.eu-central-1.amazonaws.com/'

export async function uploadResultsToBucket(urlString: string): Promise<string> {
  const filePath = './measures/deep-blue-performance-test.uf.html';
  const recordBody = readFileSync(filePath);
  const recordKey = getRecordKey(urlString);
  await uploadRecord(recordKey, recordBody);
  unlinkSync(filePath);
  return `${hostUrl}${recordKey}`;
}

function getRecordKey(urlString: string): string {
  const url = new URL(urlString);
  const timestamp = new Date().toISOString().slice(0,16).replace(":", "_");
  const hash = generateSimpleHash(20);
  return `${timestamp}${url.hostname}${hash}.uf.html`;
}

function generateSimpleHash(length: number): string {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for ( let i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

async function uploadRecord(recordKey: string, recordBody: Buffer): Promise<void> {
  const client = new S3Client({region: 'eu-central-1'});
  await putRecordInBucket(client, recordKey, recordBody);
}

async function putRecordInBucket(client: S3Client, recordKey: string, recordBody: Buffer): Promise<void> {
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

