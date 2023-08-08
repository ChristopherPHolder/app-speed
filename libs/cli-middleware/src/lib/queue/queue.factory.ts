import { AuditQueue } from 'shared';

export async function createAuditQueue(path: string, config?: object): Promise<AuditQueue> {
  const { default: Queue } = await import(path);
  return new Queue(config);
}
