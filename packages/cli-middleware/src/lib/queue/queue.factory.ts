import { AuditQueue } from '@app-speed/cli-interfaces';
import { AwsSqs, LocalQueue } from '@app-speed/runner-data-access-queue';

const queueMap = new Map<string, new (options: any) => AuditQueue>();
queueMap.set('local', LocalQueue);
queueMap.set('sqs', AwsSqs);

export async function createAuditQueue(path: string, config?: object): Promise<AuditQueue> {
  const queueImport = queueMap.get(path);
  const { default: Queue } = queueImport ? queueImport : await import(path);
  return new Queue(config);
}
