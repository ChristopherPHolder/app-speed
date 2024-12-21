import { AuditStore } from '@app-speed/runner-interfaces';
import { ResultReports } from '@app-speed/shared-utils';
import { PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';

export class S3Store implements AuditStore {
  private readonly client: S3Client;
  private readonly defaultConfig: S3ClientConfig = {
    region: 'eu-central-1',
  };
  private readonly bucketName = 'deepblue-userflow-records';
  private readonly bucketUrl = 'https://deepblue-userflow-records.s3.eu-central-1.amazonaws.com/';

  constructor() {
    this.client = new S3Client(this.defaultConfig);
  }

  public async store(auditResults: ResultReports): Promise<string> {
    return await this.uploadResultsToBucket(auditResults);
  }

  async uploadResultsToBucket(auditResults: ResultReports): Promise<string> {
    const recordKey = this.getRecordKey();
    await this.uploadRecord(recordKey, auditResults.htmlReport, 'html');
    await this.uploadRecord(recordKey, auditResults.jsonReport, 'json');
    return recordKey;
  }

  async uploadRecord(recordKey: string, recordBody: string, type: 'json' | 'html'): Promise<void> {
    const cacheControl = 'public, max-age=0, must-revalidate';
    const params = {
      Bucket: this.bucketName,
      Key: recordKey + '.uf.' + type,
      Body: recordBody,
      CacheControl: cacheControl,
      ContentType: type === 'html' ? 'text/html' : 'application/json',
    };
    const command = new PutObjectCommand(params);
    await this.client.send(command);
  }

  getRecordKey(): string {
    const timestamp = new Date().toISOString().slice(0, 16).replace(':', '_');
    const hash = this.generateSimpleHash(20);
    return `${timestamp}${hash}`;
  }

  generateSimpleHash(length: number): string {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
}
