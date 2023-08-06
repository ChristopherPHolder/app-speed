import { AuditQueue } from 'shared';

async function createAuditQueue(path: string, config?: object): Promise<AuditQueue> {
  const { default: Queue } = await import(path);
  return new Queue(config);
}

const factory = {
  createAuditQueue
}
export default factory;
