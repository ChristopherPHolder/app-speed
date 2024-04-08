import { AuditQueue } from '@app-speed/cli-interfaces';

const queueMap = new Map<string, Promise<any>>();
queueMap.set('local', import('@app-speed/audit-queue/local-queue'));
queueMap.set('sqs', import('@app-speed/audit-queue/aws-sqs'));

export async function createAuditQueue(path: string, config?: object): Promise<AuditQueue> {
  const queueImport = queueMap.get(path);
  const { default: Queue } = queueImport ? await queueImport : await import(path);
  return new Queue(config);
}
