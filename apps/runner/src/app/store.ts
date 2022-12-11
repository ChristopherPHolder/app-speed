import {S3Client, PutObjectCommand, S3ClientConfig} from '@aws-sdk/client-s3';
import {environment} from '../environments/environment';
import {ResultReports} from 'shared';

export async function uploadResultsToBucket(urlString: string, reports: ResultReports): Promise<string> {
  const recordBody = reports.htmlReport;
  const recordKey = getRecordKey(urlString);
  await uploadRecord(recordKey, recordBody);
  return `${environment.s3ResultsBucket.url}${recordKey}`;
}

function getRecordKey(urlString: string): string {
  const url = new URL(urlString);
  const timestamp = new Date().toISOString().slice(0, 16).replace(':', '_');
  const hash = generateSimpleHash(20);
  return `${timestamp}${url.hostname}${hash}.uf.html`;
}

function generateSimpleHash(length: number): string {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

async function uploadRecord(recordKey: string, recordBody: string): Promise<void> {
  const s3Config: S3ClientConfig = {region: environment.s3ResultsBucket.region};
  const client = new S3Client(s3Config);
  await putRecordInBucket(client, recordKey, recordBody);
}

async function putRecordInBucket(client: S3Client, recordKey: string, recordBody: string): Promise<void> {
  const cacheControl = 'public, max-age=0, must-revalidate';
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const params = {
    Bucket: environment.s3ResultsBucket.name,
    Key: recordKey,
    Body: recordBody,
    CacheControl: cacheControl,
    ContentType: 'text/html'
  };
  const command = new PutObjectCommand(params);
  await client.send(command);
}
