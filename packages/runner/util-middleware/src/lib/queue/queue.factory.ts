import { AuditQueue } from '@runner/interface';

const queueMap = new Map<string, Promise<any>>();
queueMap.set('local', import('@runner/queue/local-queue'));
queueMap.set('sqs', import('@runner/queue/aws-sqs'));

export async function createAuditQueue(path: string, config?: object): Promise<AuditQueue> {
  const queueImport = queueMap.get(path);
  const { default: Queue } = queueImport ? await queueImport : await import(path);
  return new Queue(config);
}
