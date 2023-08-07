import { cwd } from 'process';
import { AuditQueue } from 'shared';

async function createAuditQueue(path: string, config?: object): Promise<AuditQueue> {
  console.log('CWD -> ', cwd());
  // eslint-disable-next-line @nx/enforce-module-boundaries,@typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @nx/enforce-module-boundaries
  const { default: Queue } = await import('../../../../dist/libs/audit-queue/index.js');
  return new Queue(config);
}

const factory = {
  createAuditQueue
}
export default factory;
