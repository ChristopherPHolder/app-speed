import dotenv from 'dotenv'
dotenv.config()
import { readFileSync, unlinkSync } from 'fs';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandOutput,
  GetObjectCommand,
  GetObjectCommandInput
} from '@aws-sdk/client-s3';

export async function uploadResultsToBucket(urlString: string): Promise<string> {
  const filePath = './measures/deep-blue-performance-test.uf.html';
  const recordBody = readFileSync(filePath);
  const recordKey = getRecordKey(urlString);
  const uploadResponse = await uploadRecord(recordKey, recordBody);
  unlinkSync(filePath);
  console.log(uploadResponse);
  return uploadResponse;
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

async function uploadRecord(recordKey: string, recordBody: Buffer): Promise<string> {
  const client = new S3Client({region: 'eu-central-1'});
  await putRecordInBucket(client, recordKey, recordBody);
  return await getRecordUrl(client, recordKey);
}

async function putRecordInBucket(client: S3Client, recordKey: string, recordBody: Buffer): Promise<PutObjectCommandOutput> {
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

async function getRecordUrl(client: S3Client, recordKey: string): Promise<string> {
  const params: GetObjectCommandInput = {
    Bucket: 'deepblue-userflow-records',
    Key: recordKey
  }
  const command = new GetObjectCommand(params);
  const response = await client.send(command);
  console.log(response);
  return response.WebsiteRedirectLocation as string;
}